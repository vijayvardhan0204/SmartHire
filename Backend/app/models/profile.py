from sqlalchemy import Column, Integer, String, Text, DateTime , ForeignKey 
from sqlalchemy.sql import func
from ..db.database import Base
from sqlalchemy.orm import relationship


class Profile(Base):
    __tablename__ = "profile"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    full_name = Column(String(100))
    company_name = Column(String(150))
    experience_years = Column(String(30))
    skills = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", backref="profile")
