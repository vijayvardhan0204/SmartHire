from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional, Literal
from datetime import datetime

ExperienceLevel = Literal[
    "fresher",
    "1 to 3 years",
    "4 to 8 years",
    "9 and above"
]

def normalize_experience_level(value):
    if value is None:
        return None

    text = str(value).strip().lower()
    if text == "":
        return None
    if text in {"fresher", "1 to 3 years", "4 to 8 years", "9 and above"}:
        return text

    try:
        numeric = float(text)
    except ValueError:
        return None

    if numeric <= 0:
        return "fresher"
    if numeric <= 3:
        return "1 to 3 years"
    if numeric <= 8:
        return "4 to 8 years"
    return "9 and above"


class ProfileCreate(BaseModel):
    full_name: Optional[str] = None
    company_name: Optional[str] = None
    experience_years: Optional[ExperienceLevel] = None
    skills: Optional[str] = None

    @field_validator("experience_years", mode="before")
    @classmethod
    def validate_experience_years(cls, value):
        return normalize_experience_level(value)


class ProfileResponse(ProfileCreate):
    id: int
    user_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class MyProfileResponse(ProfileResponse):
    email: str
    phone: str | None = None


class RecruiterCandidateProfileResponse(BaseModel):
    user_id: int
    name: str | None = None
    email: str
    phone: str | None = None
    full_name: str | None = None
    company_name: str | None = None
    experience_years: ExperienceLevel | None = None
    skills: str | None = None

    @field_validator("experience_years", mode="before")
    @classmethod
    def validate_experience_years(cls, value):
        return normalize_experience_level(value)
