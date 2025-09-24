from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from datetime import timedelta

from app.schemas.user import UserCreate, UserLogin, UserResponse, Token, UserUpdate
from app.services.auth_service import AuthService
from app.db.mysql import get_db
from app.models.user import User
from app.dependencies import get_current_active_user

router = APIRouter()

# Authentication endpoints
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    db_user = AuthService.register_user(db, user)
    return db_user

@router.post("/login", response_model=Token)
async def login_user(user: UserLogin, db: Session = Depends(get_db)):
    """Login user and return JWT token"""
    # Authenticate user
    db_user = AuthService.authenticate_user(db, user.username, user.password)

    # Create access token
    access_token_expires = timedelta(minutes=30000)
    access_token = AuthService.create_access_token(
        data={"sub": db_user.username},
        expires_delta=access_token_expires
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=30000 * 60,  # 30 minutes in seconds
        user=UserResponse.model_validate(db_user)
    )