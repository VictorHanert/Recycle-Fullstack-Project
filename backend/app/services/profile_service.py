"""Profile service for user profile operations."""
from typing import Optional, List
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func
from fastapi import HTTPException, status

from app.models.user import User
from app.models.product import Product
from app.models.location import Location
from app.models.favorites import Favorite
from app.models.item_views import ItemView
from app.models.price_history import ProductPriceHistory
from app.models.media import ProductImage
from app.models.messages import Message
from app.schemas.user import ProfileUpdate, UserProfileResponse, PublicUserProfile
from app.schemas.location import LocationCreate
from app.services.location_service import LocationService


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
        """Hard delete user account and all related data"""
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        try:
            # Delete messages sent by the user first (to avoid foreign key constraint issues)
            db.query(Message).filter(Message.sender_id == user_id).delete()

            # Get all user's products first
            user_products = db.query(Product).filter(Product.seller_id == user_id).all()
            product_ids = [p.id for p in user_products]

            # Delete all related data for user's products
            if product_ids:
                db.query(Favorite).filter(Favorite.product_id.in_(product_ids)).delete()
                db.query(ItemView).filter(ItemView.product_id.in_(product_ids)).delete()
                db.query(ProductPriceHistory).filter(ProductPriceHistory.product_id.in_(product_ids)).delete()
                db.query(ProductImage).filter(ProductImage.product_id.in_(product_ids)).delete()

            # Delete all other user-related data
            db.query(Product).filter(Product.seller_id == user_id).delete()
            db.query(Favorite).filter(Favorite.user_id == user_id).delete()
            db.query(ItemView).filter(ItemView.viewer_user_id == user_id).delete()

            # Finally delete the user
            db.delete(user)
            db.commit()
            return True
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to delete user account: {str(e)}"
            )
