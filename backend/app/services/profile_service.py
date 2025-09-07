"""Profile service for user profile operations."""
from typing import Optional, List
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func
from fastapi import HTTPException, status

from app.models.user import User
from app.models.product import Product
from app.models.location import Location
from app.schemas.user import ProfileUpdate, UserProfileResponse, PublicUserProfile
from app.schemas.location import LocationCreate
from app.services.location_service import LocationService
from app.services.auth_service import AuthService


class ProfileService:
    """Service class for user profile operations"""

    @staticmethod
    def get_user_profile(db: Session, user_id: int) -> Optional[UserProfileResponse]:
        """Get detailed user profile with product count"""
        user = db.query(User).options(joinedload(User.location)).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Get product count
        product_count = db.query(func.count(Product.id)).filter(
            Product.seller_id == user_id,
            Product.deleted_at.is_(None)
        ).scalar()

        # Convert to response model
        user_data = UserProfileResponse.model_validate(user)
        user_data.product_count = product_count
        return user_data

    @staticmethod
    def get_public_profile(db: Session, user_id: int) -> Optional[PublicUserProfile]:
        """Get public user profile (visible to all users)"""
        user = db.query(User).options(joinedload(User.location)).filter(
            User.id == user_id,
            User.is_active == True
        ).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Get active product count
        product_count = db.query(func.count(Product.id)).filter(
            Product.seller_id == user_id,
            Product.status == 'active',
            Product.deleted_at.is_(None)
        ).scalar()

        return PublicUserProfile(
            id=user.id,
            username=user.username,
            full_name=user.full_name,
            location=user.location,
            created_at=user.created_at,
            product_count=product_count
        )

    @staticmethod
    def update_profile(db: Session, user_id: int, profile_update: ProfileUpdate) -> User:
        """Update user profile information"""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Update only provided fields
        update_data = profile_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)
        
        # Update timestamp
        from datetime import datetime, timezone
        user.updated_at = datetime.now(timezone.utc)

        try:
            db.commit()
            db.refresh(user)
            return user
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Update failed due to database constraint"
            )

    @staticmethod
    def add_user_location(db: Session, user_id: int, location_data: LocationCreate) -> User:
        """Add or update user location"""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Create or get existing location
        location = LocationService.create_location(db, location_data)
        
        # Update user's location
        user.location_id = location.id
        
        try:
            db.commit()
            db.refresh(user)
            return user
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update user location"
            )

    @staticmethod
    def remove_user_location(db: Session, user_id: int) -> User:
        """Remove user location"""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        user.location_id = None
        
        try:
            db.commit()
            db.refresh(user)
            return user
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to remove user location"
            )

    @staticmethod
    def get_user_products(db: Session, user_id: int, current_user_id: Optional[int] = None, 
                         skip: int = 0, limit: int = 20) -> List[Product]:
        """Get products for a user profile"""
        query = db.query(Product).filter(
            Product.seller_id == user_id,
            Product.deleted_at.is_(None)
        )

        # If viewing own profile, show all products; otherwise only active ones
        if current_user_id != user_id:
            query = query.filter(Product.status == 'active')

        return query.options(
            joinedload(Product.location),
            joinedload(Product.seller)
        ).offset(skip).limit(limit).all()

    @staticmethod
    def delete_user_account(db: Session, user_id: int) -> bool:
        """Soft delete user account and handle related data"""
        from datetime import datetime, timezone
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        try:
            # Soft delete all user's products
            db.query(Product).filter(Product.seller_id == user_id).update({
                "deleted_at": datetime.now(timezone.utc),
                "status": "draft"
            })

            # Soft delete the user (deactivate instead of actual deletion)
            user.is_active = False
            user.email = f"deleted_{user.id}_{user.email}"  # Prevent email conflicts
            user.username = f"deleted_{user.id}_{user.username}"  # Prevent username conflicts
            
            db.commit()
            return True
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to delete user account: {str(e)}"
            )
