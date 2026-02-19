from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
import enum
from sqlalchemy.sql import func
from ..db.database import Base
from sqlalchemy.orm import relationship


class JobStatus(str, enum.Enum):
    open = "open"
    closed = "closed"


class JobListing(Base):
    __tablename__ = "job_listing"

    id = Column(Integer, primary_key=True, index=True)
    recruiter_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))

    title = Column(String(150), nullable=False)
    role = Column(String(100))
    description = Column(Text)
    package = Column(String(50))
    location = Column(String(100))
    mode = Column(String(20))
    experience_required = Column(Integer)

    status = Column(Enum(JobStatus), default=JobStatus.open)

    resume_min_score = Column(Integer, default=40)
    interview_min_score = Column(Integer, default=60)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    recruiter = relationship("User", backref="job_listings")
