"""Products router for product-related operations."""
from math import ceil
from typing import List, Optional
import os
import shutil
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File
from sqlalchemy.orm import Session

from app.db.mysql import get_db
from app.dependencies import get_current_active_user
from app.models.user import User
from app.models.category import Category
from app.models.location import Location
from app.models.media import ProductImage
from app.schemas.product import (
    ProductCreate,
    ProductFilter,
    ProductListResponse,
    ProductResponse,
    ProductUpdate,
    CategoryInfo,
    LocationInfo,
)
from app.services.product_service import ProductService
from app.schemas.product import ProductDetailsResponse

router = APIRouter()

@router.get("/", response_model=ProductListResponse)
async def get_all_products(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(15, ge=1, le=100, description="Items per page"),
    category: Optional[str] = Query(None, description="Filter by category"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price"),
    location_id: Optional[int] = Query(None, description="Filter by location ID"),
    condition: Optional[str] = Query(None, description="Filter by condition"),
    sort: Optional[str] = Query("newest", description="Sort by: newest, oldest, price_low, price_high, title"),
    search: Optional[str] = Query(None, description="Search in title and description"),
    show_sold: bool = Query(False, description="Include sold products"),
    db: Session = Depends(get_db)
):
    """Get all products with filtering and pagination"""
    skip = (page - 1) * size

    # Create filter object
    filter_params = ProductFilter(
        category=category,
        min_price=min_price,
        max_price=max_price,
        location_id=location_id,
        condition=condition,
        sort_by=sort,
        search_term=search,
        is_sold=None if show_sold else False
    )

    products, total = ProductService.get_products(db, skip=skip, limit=size, filter_params=filter_params)
    total_pages = ceil(total / size) if total > 0 else 1

    return ProductListResponse(
        products=[ProductResponse.model_validate(product) for product in products],
        total=total,
        page=page,
        size=size,
        total_pages=total_pages
    )

@router.get("/my-products", response_model=ProductListResponse)
async def get_my_products(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get products posted by the current user"""
    skip = (page - 1) * size
    products, total = ProductService.get_products_by_seller(db, current_user.id, skip=skip, limit=size)
    total_pages = ceil(total / size) if total > 0 else 1

    return ProductListResponse(
        products=[ProductResponse.model_validate(product) for product in products],
        total=total,
        page=page,
        size=size,
        total_pages=total_pages
    )

@router.get("/locations", response_model=List[LocationInfo])
async def get_all_locations(db: Session = Depends(get_db)):
    """Get all product locations"""
    locations = db.query(Location).order_by(Location.city, Location.postcode).all()
    return [LocationInfo.model_validate(loc) for loc in locations]

@router.get("/categories", response_model=List[CategoryInfo])
async def get_all_categories(db: Session = Depends(get_db)):
    """Get all product categories"""
    categories = db.query(Category).order_by(Category.name).all()
    return [CategoryInfo.model_validate(cat) for cat in categories]

@router.get("/productdetails", response_model=ProductDetailsResponse)
async def get_all_product_details(db: Session = Depends(get_db)):
    """Get all product details including colors, materials, tags, and locations"""
    details = ProductService.get_all_details(db)
    locations = db.query(Location).order_by(Location.city, Location.postcode).all()

    return ProductDetailsResponse(
        colors=[{"id": color.id, "name": color.name} for color in details["colors"]],
        materials=[{"id": material.id, "name": material.name} for material in details["materials"]],
        tags=[{"id": tag.id, "name": tag.name} for tag in details["tags"]],
        locations=[LocationInfo.model_validate(loc) for loc in locations]
    )
@router.post("/upload-image", response_model=dict)
async def upload_product_image(
    file: UploadFile = File(...),
    # current_user: User = Depends(get_current_active_user),  # Temporarily disabled for testing
    db: Session = Depends(get_db)
):
    """Upload a product image and return the URL"""
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPEG, PNG, WebP, and GIF images are allowed"
        )

    # Validate file size (max 5MB)
    file_size = 0
    content = await file.read()
    file_size = len(content)

    if file_size > 5 * 1024 * 1024:  # 5MB
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size must be less than 5MB"
        )

    # Create uploads directory if it doesn't exist
    upload_dir = Path("uploads/product_images")
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Generate unique filename
    file_extension = Path(file.filename).suffix.lower()
    unique_filename = f"{uuid4()}{file_extension}"
    file_path = upload_dir / unique_filename

    # Save file
    with open(file_path, "wb") as buffer:
        buffer.write(content)

    # Create URL (in production, this would be a cloud storage URL)
    image_url = f"/uploads/product_images/{unique_filename}"

    return {"url": image_url, "filename": unique_filename}

@router.get("/category/{category}", response_model=ProductListResponse)
async def get_products_by_category(
    category: str,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db)
):
    """Get products by category"""
    skip = (page - 1) * size
    products, total = ProductService.get_products_by_category(db, category, skip=skip, limit=size)
    total_pages = ceil(total / size) if total > 0 else 1

    return ProductListResponse(
        products=[ProductResponse.model_validate(product) for product in products],
        total=total,
        page=page,
        size=size,
        total_pages=total_pages
    )

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, db: Session = Depends(get_db)):
    """Get a specific product by ID"""
    product_dict = ProductService.get_product_by_id(db, product_id)
    if not product_dict:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    return ProductResponse.model_validate(product_dict)

@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product: ProductCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new product listing"""
    db_product = ProductService.create_product(db, product, current_user.id)
    return ProductResponse.model_validate(db_product)

@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    product_update: ProductUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a product listing"""
    db_product = ProductService.update_product(db, product_id, product_update, current_user.id)
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or you don't have permission to update it"
        )
    return ProductResponse.model_validate(db_product)

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a product listing"""
    success = ProductService.delete_product(db, product_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or you don't have permission to delete it"
        )
    return {"message": "Product deleted successfully"}
