"""Location Router: Endpoints for managing locations."""
from typing import List
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.db.mysql import get_db
from app.schemas.location import LocationCreate, LocationResponse, LocationUpdate
from app.services.location_service import LocationService

router = APIRouter()

@router.get("/search", response_model=List[LocationResponse])
async def search_locations(
    q: str = Query(..., min_length=1, description="Search query for city or postcode"),
    db: Session = Depends(get_db)
):
    """Search locations by city or postcode"""
    return LocationService.search_locations(db, q)


@router.get("/", response_model=List[LocationResponse])
async def get_all_locations(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get all locations with pagination"""
    return LocationService.get_all_locations(db, skip, limit)


@router.get("/{location_id}", response_model=LocationResponse)
async def get_location(
    location_id: int,
    db: Session = Depends(get_db)
):
    """Get location by ID"""
    location = LocationService.get_location_by_id(db, location_id)
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )
    return location


@router.post("/", response_model=LocationResponse)
async def create_location(
    location: LocationCreate,
    db: Session = Depends(get_db)
):
    """Create a new location (authenticated users only)"""
    return LocationService.create_location(db, location)

@router.put("/{location_id}", response_model=LocationResponse)
async def update_location(
    location_id: int,
    location_update: LocationUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing location (authenticated users only)"""
    return LocationService.update_location(db, location_id, location_update)


@router.delete("/{location_id}")
async def delete_location(
    location_id: int,
    db: Session = Depends(get_db)
):
    """Delete a location (authenticated users only)"""
    location = LocationService.get_location_by_id(db, location_id)
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )
    try:
        db.delete(location)
        db.commit()
        return {"message": "Location deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to delete location"
        )
        