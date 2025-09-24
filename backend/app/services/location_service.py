"""Location service for CRUD operations."""
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status

from app.models.location import Location
from app.schemas.location import LocationCreate, LocationUpdate


class LocationService:
    """Service class for location operations"""

    @staticmethod
    def create_location(db: Session, location: LocationCreate) -> Location:
        """Create a new location"""
        # Check if location already exists
        existing_location = db.query(Location).filter(
            Location.city == location.city,
            Location.postcode == location.postcode
        ).first()
        
        if existing_location:
            return existing_location

        try:
            db_location = Location(
                city=location.city,
                postcode=location.postcode
            )
            db.add(db_location)
            db.commit()
            db.refresh(db_location)
            return db_location
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Location creation failed"
            )

    @staticmethod
    def get_location_by_id(db: Session, location_id: int) -> Optional[Location]:
        """Get location by ID"""
        return db.query(Location).filter(Location.id == location_id).first()

    @staticmethod
    def get_all_locations(db: Session, skip: int = 0, limit: int = 100) -> List[Location]:
        """Get all locations with pagination"""
        return db.query(Location).offset(skip).limit(limit).all()

    @staticmethod
    def search_locations(db: Session, query: str) -> List[Location]:
        """Search locations by city or postcode"""
        return db.query(Location).filter(
            (Location.city.ilike(f"%{query}%")) | 
            (Location.postcode.ilike(f"%{query}%"))
        ).limit(10).all()

    @staticmethod
    def update_location(db: Session, location_id: int, location_update: LocationUpdate) -> Location:
        """Update location information"""
        location = db.query(Location).filter(Location.id == location_id).first()
        if not location:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Location not found"
            )

        # Update only provided fields
        update_data = location_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(location, field, value)

        try:
            db.commit()
            db.refresh(location)
            return location
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Update failed due to database constraint"
            )

    @staticmethod
    def delete_location(db: Session, location_id: int) -> bool:
        """Delete a location"""
        location = db.query(Location).filter(Location.id == location_id).first()
        if not location:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Location not found"
            )

        # Check if location is being used by users or products
        if location.users or location.products:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete location that is in use"
            )

        try:
            db.delete(location)
            db.commit()
            return True
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Delete failed due to database constraint"
            )
