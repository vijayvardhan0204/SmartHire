from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db.database import get_db
from ..models.job import JobListing
from ..models.user import User
from ..schemas.job import JobCreate, JobResponse
from ..core.auth import require_recruiter, get_current_user

router = APIRouter(prefix="/jobs", tags=["Jobs"])


# ✅ Recruiter Creates Job
@router.post("/", response_model=JobResponse)
def create_job(
    job_data: JobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recruiter)
):
    job = JobListing(
        recruiter_id=current_user.id,
        **job_data.model_dump()
    )

    db.add(job)
    db.commit()
    db.refresh(job)

    return job


# ✅ List All Jobs (Public)
@router.get("/", response_model=list[JobResponse])
def list_jobs(db: Session = Depends(get_db)):
    return db.query(JobListing).all()

# ✅ Recruiter’s Own Jobs
@router.get("/my", response_model=list[JobResponse])
def get_my_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recruiter)
):
    return db.query(JobListing).filter(
        JobListing.recruiter_id == current_user.id
    ).all()


# ✅ Job Details
@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(JobListing).filter(
        JobListing.id == job_id
    ).first()

    if not job:
        raise HTTPException(404, "Job not found")

    return job

@router.patch("/{job_id}/status")
def update_job_status(
    job_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    if current_user.role != "recruiter":
        raise HTTPException(403, "Not allowed")

    job = db.query(JobListing).filter(
        JobListing.id == job_id,
        JobListing.recruiter_id == current_user.id
    ).first()

    if not job:
        raise HTTPException(404, "Job not found")

    if status not in ["open", "closed"]:
        raise HTTPException(400, "Invalid status")

    job.status = status
    db.commit()

    return {
        "message": f"Job status updated to {status}",
        "job_id": job.id,
        "status": job.status
    }
