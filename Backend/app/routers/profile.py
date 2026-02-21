from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db.database import get_db
from ..models.profile import Profile
from ..models.user import User
from ..models.job import JobListing
from ..models.application import CandidateApplication
from ..schemas.profile import (
    ProfileCreate,
    ProfileResponse,
    MyProfileResponse,
    RecruiterCandidateProfileResponse
)
from ..core.auth import get_current_user

router = APIRouter(
    prefix="/profile",
    tags=["Profile"]
)


@router.post("/", response_model=ProfileResponse)
def create_or_update_profile(
    data: ProfileCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    profile = db.query(Profile).filter(
        Profile.user_id == current_user.id
    ).first()

    # update existing profile
    if profile:
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(profile, key, value)

    # create new profile
    else:
        profile = Profile(
            user_id=current_user.id,
            **data.model_dump()
        )
        db.add(profile)

    db.commit()
    db.refresh(profile)

    return profile


@router.get("/me", response_model=MyProfileResponse)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    profile = db.query(Profile).filter(
        Profile.user_id == current_user.id
    ).first()

    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    return {
        "id": profile.id,
        "user_id": profile.user_id,
        "created_at": profile.created_at,
        "full_name": profile.full_name,
        "company_name": profile.company_name,
        "experience_years": profile.experience_years,
        "skills": profile.skills,
        "email": current_user.email,
        "phone": current_user.phone
    }


@router.get("/candidate/{candidate_user_id}", response_model=RecruiterCandidateProfileResponse)
def get_candidate_profile_for_recruiter(
    candidate_user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if (current_user.role or "").lower() != "recruiter":
        raise HTTPException(status_code=403, detail="Not allowed")

    has_access = (
        db.query(CandidateApplication.id)
        .join(JobListing, JobListing.id == CandidateApplication.job_id)
        .filter(
            CandidateApplication.user_id == candidate_user_id,
            JobListing.recruiter_id == current_user.id
        )
        .first()
    )

    if not has_access:
        raise HTTPException(status_code=403, detail="Not allowed")

    candidate = db.query(User).filter(User.id == candidate_user_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    profile = db.query(Profile).filter(Profile.user_id == candidate_user_id).first()

    return {
        "user_id": candidate.id,
        "name": candidate.name,
        "email": candidate.email,
        "phone": candidate.phone,
        "full_name": profile.full_name if profile else None,
        "company_name": profile.company_name if profile else None,
        "experience_years": profile.experience_years if profile else None,
        "skills": profile.skills if profile else None
    }
