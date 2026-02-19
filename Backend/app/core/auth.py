from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from jose import jwt, JWTError
from dotenv import load_dotenv
import os

from sqlalchemy.orm import Session
from ..db.database import get_db
from ..models.user import User

load_dotenv()

security = HTTPBearer()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")
)


# ✅ Create JWT Token
def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None
):
    to_encode = data.copy()

    expire = datetime.utcnow() + (
        expires_delta or
        timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    to_encode.update({"exp": expire})

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# ✅ Get Current Logged-in User
def get_current_user(
    credentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("sub")

        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

    user = db.query(User).filter(
        User.id == int(user_id)
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return user


# ✅ Recruiter Only Access
def require_recruiter(
    user: User = Depends(get_current_user)
):
    if user.role.lower() != "recruiter":
        raise HTTPException(
            status_code=403,
            detail="Recruiter access required"
        )
    return user


# ✅ Candidate Only Access
def require_candidate(
    user: User = Depends(get_current_user)
):
    if user.role.lower() != "candidate":
        raise HTTPException(
            status_code=403,
            detail="Candidate access required"
        )
    return user


def require_admin(
    user: User = Depends(get_current_user)
):
    if user.role.lower() != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )
    return user
