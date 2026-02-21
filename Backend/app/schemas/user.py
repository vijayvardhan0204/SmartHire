from pydantic import BaseModel, EmailStr, ConfigDict, constr
from datetime import datetime
from typing import Optional

class UserCreate(BaseModel):
    name: constr(strip_whitespace=True, min_length=1)
    email: EmailStr
    phone: constr(strip_whitespace=True, min_length=1)
    password: str
    role: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class UpdateProfile(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
