from datetime import datetime, timedelta
import os
import shutil

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from sqlalchemy.orm import Session

from app.core.scheduler import scheduler
from ..db.database import get_db
from ..models.application import CandidateApplication
from ..models.interview import Interview
from ..models.job import JobListing
from ..schemas.application import (
    ApplicationCreate,
    ApplicationResponse,
    UpdateApplicationStatus
)

from ..core.auth import get_current_user
from ..core.resume_parser import extract_text_from_pdf
from ..core.resume_scoring import calculate_resume_score
from ..core.ai_resume_scoring import analyze_resume_with_ai
from ..core.bland_ai import start_bland_interview

from ..core.ai_interview_evaluator import evaluate_interview

router = APIRouter(prefix="/applications", tags=["Applications"])
BLAND_WEBHOOK_SECRET = os.getenv("BLAND_WEBHOOK_SECRET")


# ============================================================
# CANDIDATE APPLIES TO JOB
# ============================================================
@router.post("/", response_model=ApplicationResponse)
def apply_job(
    data: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if (current_user.role or "").lower() != "candidate":
        raise HTTPException(403, "Only candidates can apply")

    job = db.query(JobListing).filter(JobListing.id == data.job_id).first()
    if not job:
        raise HTTPException(404, "Job not found")
    if job.status != "open":
        raise HTTPException(400, "Job is closed")


    application = CandidateApplication(
        user_id=current_user.id,
        job_id=data.job_id,
        status="applied",
        retry_count=0
    )

    db.add(application)
    db.commit()
    db.refresh(application)
    return application


# ============================================================
# CANDIDATE - VIEW OWN APPLICATIONS
# ============================================================
@router.get("/my", response_model=list[ApplicationResponse])
def my_applications(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return (
        db.query(CandidateApplication)
        .filter(CandidateApplication.user_id == current_user.id)
        .order_by(CandidateApplication.created_at.desc())
        .all()
    )


# ============================================================
# RECRUITER - VIEW ALL APPLICATIONS FOR A JOB
# ============================================================
@router.get("/job/{job_id}")
def job_applications(
    job_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if (current_user.role or "").lower() != "recruiter":
        raise HTTPException(403, "Not allowed")

    job = (
        db.query(JobListing)
        .filter(
            JobListing.id == job_id,
            JobListing.recruiter_id == current_user.id
        )
        .first()
    )

    if not job:
        raise HTTPException(404, "Job not found")

    applications = (
        db.query(CandidateApplication)
        .filter(CandidateApplication.job_id == job_id)
        .order_by(
            CandidateApplication.status.desc(),
            CandidateApplication.voice_score.desc().nullslast(),
            CandidateApplication.resume_score.desc()
        )
        .all()
    )

    result = []

    for app in applications:
        score_parts = [
            app.resume_score,
            app.voice_score,
            app.communication_score,
            app.technical_score,
            app.confidence_score
        ]

        valid_scores = [s for s in score_parts if s is not None]

        performance_score = (
            round(sum(valid_scores) / len(valid_scores), 2)
            if valid_scores else None
        )

        result.append({
            "application_id": app.id,
            "user_id": app.user_id,
            "candidate_name": app.user.name,
            "resume_score": app.resume_score,
            "voice_score": app.voice_score,
            "performance_score": performance_score,
            "communication_score": app.communication_score,
            "technical_score": app.technical_score,
            "confidence_score": app.confidence_score,
            "interview_feedback": app.interview_feedback,
            "status": app.status,
            "applied_at": app.created_at
        })

    return result


# ============================================================
# GET INTERVIEW TRANSCRIPT
# ============================================================
@router.get("/{application_id}/transcript")
def get_application_transcript(
    application_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if (current_user.role or "").lower() != "recruiter":
        raise HTTPException(403, "Not allowed")

    application = db.query(CandidateApplication).filter(
        CandidateApplication.id == application_id
    ).first()

    if not application:
        raise HTTPException(404, "Application not found")

    if application.job.recruiter_id != current_user.id:
        raise HTTPException(403, "Not allowed")

    interview = db.query(Interview).filter(
        Interview.candidate_application_id == application_id
    ).first()

    if not interview or not interview.transcript:
        return {
            "application_id": application_id,
            "transcript": None,
            "message": "Transcript not available yet"
        }

    return {
        "application_id": application_id,
        "transcript": interview.transcript
    }


# ============================================================
# UPLOAD RESUME + AI SCORING
# ============================================================
@router.post("/{application_id}/upload-resume")
def upload_resume(
    application_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    application = (
        db.query(CandidateApplication)
        .filter(
            CandidateApplication.id == application_id,
            CandidateApplication.user_id == current_user.id
        )
        .first()
    )

    if not application:
        raise HTTPException(404, "Application not found")

    # ---------------- SAVE FILE ----------------
    upload_dir = "uploads/resumes"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = f"{upload_dir}/{application_id}.pdf"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    resume_text = extract_text_from_pdf(file_path)
    job = application.job

    # ---------------- TF-IDF SCORING ----------------
    tfidf_score = calculate_resume_score(resume_text, job.description or "")

    # ---------------- CONDITIONAL GEMINI ----------------
    if tfidf_score < 35:
        resume_final_score = tfidf_score
        ai_result = {
            "score": tfidf_score,
            "missing_skills": [],
            "reason": "Low keyword similarity"
        }
    else:
        ai_result = analyze_resume_with_ai(
            resume_text=resume_text,
            job_description=job.description or ""
        )

        ai_score = ai_result.get("score", tfidf_score)

        if tfidf_score < 60:
            resume_final_score = int((0.7 * tfidf_score) + (0.3 * ai_score))
        else:
            resume_final_score = int((0.4 * tfidf_score) + (0.6 * ai_score))

    # ---------------- SAVE RESUME DATA ----------------
    application.resume_score = resume_final_score
    application.ai_reason = ai_result.get("reason")
    application.missing_skills = ", ".join(
        ai_result.get("missing_skills", [])
    )
    application.retry_count = 0
    application.voice_score = None

    # ---------------- SHORTLIST LOGIC ----------------
    if job.resume_min_score and resume_final_score < job.resume_min_score:
        application.status = "rejected"
    else:
        application.status = "interview_scheduled"
        candidate = application.user

        run_time = datetime.now() + timedelta(minutes=2)

        scheduler.add_job(
            start_bland_interview,
            "date",
            run_date=run_time,
            args=[
                candidate.phone,
                candidate.name,
                job.title,
                application.id
            ]
        )

        print(f"📅 Interview scheduled at {run_time}")

    db.commit()

    return {
        "message": "Resume uploaded and analyzed",
        "resume_score": resume_final_score,
        "status": application.status
    }


# ============================================================
# RECRUITER MANUAL STATUS UPDATE
# ============================================================
@router.patch("/{application_id}/status")
def update_application_status(
    application_id: int,
    data: UpdateApplicationStatus,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if (current_user.role or "").lower() != "recruiter":
        raise HTTPException(403, "Not allowed")

    application = db.query(CandidateApplication).filter(
        CandidateApplication.id == application_id
    ).first()

    if not application:
        raise HTTPException(404, "Application not found")

    if application.job.recruiter_id != current_user.id:
        raise HTTPException(403, "Not allowed")

    allowed_status = ["shortlisted", "rejected", "hired"]

    if data.status not in allowed_status:
        raise HTTPException(400, "Invalid status")

    application.status = data.status
    db.commit()

    return {"message": "Status updated", "status": application.status}


# ============================================================
# BLAND AI WEBHOOK
# ============================================================
@router.post("/bland-webhook")
async def bland_webhook(
    request: Request,
    db: Session = Depends(get_db)
):

    # ---------- SECURITY ----------
    # received_secret = request.headers.get("X-Bland-Secret")
    # if received_secret != BLAND_WEBHOOK_SECRET:
    #     raise HTTPException(403, "Invalid webhook secret")

    try:
        data = await request.json()
    except Exception:
        return {"message": "Invalid JSON payload"}

    status = (data.get("status") or "").lower()
    metadata = data.get("metadata", {})
    application_id = metadata.get("application_id")

    if not application_id:
        return {"message": "Missing application_id"}

    application = db.query(CandidateApplication).filter(
        CandidateApplication.id == application_id
    ).first()

    if not application:
        return {"message": "Application not found"}

    # ============================================================
    # FAILED CALL HANDLING
    # ============================================================
    if status in ["no_answer", "busy", "failed"]:
        application.status = status

        if application.retry_count < 1:
            application.retry_count += 1
            db.commit()

            retry_time = datetime.now() + timedelta(minutes=2)

            scheduler.add_job(
                start_bland_interview,
                "date",
                run_date=retry_time,
                args=[
                    application.user.phone,
                    application.user.name,
                    application.job.title,
                    application.id
                ]
            )

            return {"message": "Retry scheduled"}

        else:
            db.commit()
            return {"message": f"Call ended with status: {status}", "status": application.status}

    # ============================================================
    # CALL STARTED
    # ============================================================
    if status in ["answered", "in_progress"]:
        application.status = "interview_in_progress"
        db.commit()
        return {"message": "Interview started"}

    if status != "completed":
        return {"message": "Ignoring non-completed event"}

    transcript = data.get("concatenated_transcript")
    if not transcript:
        return {"message": "Missing transcript"}

    # ============================================================
    # SAVE INTERVIEW
    # ============================================================
    interview = db.query(Interview).filter(
        Interview.candidate_application_id == application.id
    ).first()

    if not interview:
        interview = Interview(
            candidate_application_id=application.id
        )
        db.add(interview)

    interview.transcript = transcript
    interview.duration = int(data.get("corrected_duration", 0))
    interview.started_at = data.get("started_at")
    interview.ended_at = data.get("ended_at")

    # ============================================================
    # VOICE SCORING (Gemini AI)
    # ============================================================
    # ============================================================
    # AI INTERVIEW ANALYSIS (Gemini AI)
    # ============================================================
    evaluation = evaluate_interview(
    transcript=transcript,
    job_description=application.job.description
    )

    application.voice_score = evaluation["voice_score"]
    application.communication_score = evaluation["communication_score"]
    application.technical_score = evaluation["technical_score"]
    application.confidence_score = evaluation["confidence_score"]
    application.interview_feedback = evaluation["feedback"]

    interview.strengths = evaluation["strengths"]
    interview.weaknesses = evaluation["weaknesses"]
    interview.recommendation = evaluation["recommendation"]
    application.retry_count = 0


    
    


    # ============================================================
    # FINAL DECISION (Your Existing Logic)
    # ============================================================
    job = application.job

    if job.interview_min_score and application.voice_score >= job.interview_min_score:
        application.status = "shortlisted"
    else:
        application.status = "rejected"

    db.commit()

    return {"message": "Interview processed successfully"}