from pydantic import BaseModel, ConfigDict
from datetime import datetime
from .job import JobResponse



class ApplicationCreate(BaseModel):
    job_id: int


class ApplicationResponse(BaseModel):
    id: int
    user_id: int
    job_id: int
    resume_score: int | None
    voice_score: int | None
    status: str
    interview_completed: bool
    created_at: datetime

    job: JobResponse
    model_config = ConfigDict(from_attributes=True)


class UpdateApplicationStatus(BaseModel):
    status: str
