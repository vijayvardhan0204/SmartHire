from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..core.auth import require_admin
from ..db.database import get_db
from ..models.application import CandidateApplication
from ..models.job import JobListing
from ..models.user import User

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/overview")
def get_admin_overview(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_jobs = db.query(func.count(JobListing.id)).scalar() or 0
    total_applications = db.query(func.count(CandidateApplication.id)).scalar() or 0

    role_counts = (
        db.query(User.role, func.count(User.id))
        .group_by(User.role)
        .all()
    )
    user_by_role = {role: count for role, count in role_counts}

    status_counts = (
        db.query(CandidateApplication.status, func.count(CandidateApplication.id))
        .group_by(CandidateApplication.status)
        .all()
    )
    applications_by_status = {status: count for status, count in status_counts}

    recent_jobs = (
        db.query(JobListing)
        .order_by(JobListing.created_at.desc())
        .limit(10)
        .all()
    )

    users = (
        db.query(User)
        .order_by(User.created_at.desc())
        .all()
    )

    recruiters = (
        db.query(User)
        .filter(User.role == "recruiter")
        .order_by(User.created_at.desc())
        .all()
    )

    recruiter_job_counts = dict(
        db.query(JobListing.recruiter_id, func.count(JobListing.id))
        .group_by(JobListing.recruiter_id)
        .all()
    )

    recruiter_application_counts = dict(
        db.query(JobListing.recruiter_id, func.count(CandidateApplication.id))
        .join(CandidateApplication, CandidateApplication.job_id == JobListing.id)
        .group_by(JobListing.recruiter_id)
        .all()
    )

    return {
        "totals": {
            "users": total_users,
            "jobs": total_jobs,
            "applications": total_applications,
        },
        "users_by_role": user_by_role,
        "applications_by_status": applications_by_status,
        "recent_jobs": [
            {
                "id": job.id,
                "title": job.title,
                "location": job.location,
                "mode": job.mode,
                "status": job.status,
                "created_at": job.created_at,
            }
            for job in recent_jobs
        ],
        "users": [
            {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "phone": user.phone,
                "role": user.role,
                "created_at": user.created_at,
            }
            for user in users
        ],
        "recruiters": [
            {
                "id": recruiter.id,
                "name": recruiter.name,
                "email": recruiter.email,
                "phone": recruiter.phone,
                "created_at": recruiter.created_at,
                "jobs_posted": recruiter_job_counts.get(recruiter.id, 0),
                "applications_received": recruiter_application_counts.get(recruiter.id, 0),
            }
            for recruiter in recruiters
        ],
    }
