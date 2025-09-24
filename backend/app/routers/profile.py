"""Profile router for user profile CRUD operations."""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.mysql import get_db
from app.models.user import User
from app.dependencies import get_current_active_user, get_current_user_optional
from app.schemas.user import UserProfileResponse, ProfileUpdate, PublicUserProfile
from app.schemas.location import LocationCreate
from app.schemas.product import ProductResponse
from app.services.profile_service import ProfileService

router = APIRouter()

# Profile management endpoints
@router.get("/me", response_model=UserProfileResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user's detailed profile"""
    return ProfileService.get_user_profile(db, current_user.id)


@router.put("/me", response_model=UserProfileResponse)
async def update_my_profile(
    profile_update: ProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update current user's profile information"""
    ProfileService.update_profile(db, current_user.id, profile_update)
    return ProfileService.get_user_profile(db, current_user.id)


@router.delete("/me")
async def delete_my_account(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete current user's account"""
    ProfileService.delete_user_account(db, current_user.id)
    return {"message": "Account deleted successfully"}

@router.get("/me/products", response_model=List[ProductResponse])
async def get_my_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user's products (all statuses)"""
    products = ProfileService.get_user_products(
        db, current_user.id, current_user.id, skip, limit
    )
    return products


# Location management endpoints
@router.post("/me/location", response_model=UserProfileResponse)
async def add_my_location(
    location_data: LocationCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Add or update current user's location"""
    ProfileService.add_user_location(db, current_user.id, location_data)
    return ProfileService.get_user_profile(db, current_user.id)


@router.delete("/me/location", response_model=UserProfileResponse)
async def remove_my_location(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Remove current user's location"""
    ProfileService.remove_user_location(db, current_user.id)
    return ProfileService.get_user_profile(db, current_user.id)


# Public profile endpoints
@router.get("/{user_id}", response_model=PublicUserProfile)
async def get_public_profile(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Get public user profile (visible to all users)"""
    return ProfileService.get_public_profile(db, user_id)


@router.get("/{user_id}/products", response_model=List[ProductResponse])
async def get_user_products(
    user_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Get products for a specific user (only active products for public view)"""
    current_user_id = current_user.id if current_user else None
    products = ProfileService.get_user_products(
        db, user_id, current_user_id, skip, limit
    )
    return products
