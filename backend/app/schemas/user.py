from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    """Base user schema with common fields"""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50, pattern="^[a-zA-Z0-9_]+$")
    full_name: Optional[str] = Field(None, max_length=100)


class UserCreate(UserBase):
    """Schema for user creation"""
    password: str = Field(..., min_length=8, max_length=100)


class UserUpdate(BaseModel):
    """Schema for user updates"""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = None


class UserLogin(BaseModel):
    """Schema for user login"""
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=1, max_length=100)


class UserResponse(UserBase):
    """Schema for user response (without sensitive data)"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool = True
    is_admin: bool = False
    created_at: datetime
    updated_at: datetime


class UserInDB(UserResponse):
    """Schema for user in database (with hashed password)"""
    hashed_password: str


# Token schemas for authentication
class Token(BaseModel):
    """JWT Token response"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds
    user: UserResponse


class TokenData(BaseModel):
    """Token payload data"""
    username: Optional[str] = None
    expires: Optional[datetime] = None
