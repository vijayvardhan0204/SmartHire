from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
from ..core.security import hash_password
from ..core.auth import get_current_user, require_admin
from ..db.database import get_db
from ..models.user import User
from ..schemas.user import UserCreate, UserResponse

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

@router.post("/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    role = (user.role or "").strip().lower()

    # Allow bootstrap creation of the first admin only.
    if role == "admin":
        admin_exists = db.query(User).filter(User.role == "admin").first()
        if admin_exists:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin signup is restricted. Use /users/admin/create"
            )
    elif role not in {"candidate", "recruiter"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only candidate or recruiter signup is allowed here"
        )

    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    new_user = User(
        email=user.email,
        password=hash_password(user.password),
        role=role,
        name=user.name,
        phone=user.phone
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/admin/create", response_model=UserResponse)
def create_user_as_admin(
    user: UserCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    role = (user.role or "").strip().lower()
    allowed_roles = {"candidate", "recruiter", "admin"}

    if role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role"
        )

    new_user = User(
        email=user.email,
        password=hash_password(user.password),
        role=role,
        name=user.name,
        phone=user.phone
    )

    try:
        db.add(new_user)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    db.refresh(new_user)
    return new_user

@router.get("/", response_model=List[UserResponse])
def get_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    return db.query(User).all()

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
