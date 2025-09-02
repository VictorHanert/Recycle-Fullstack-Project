from fastapi import APIRouter, HTTPException, Depends, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from math import ceil

from app.schemas.product import (
    ProductResponse, ProductCreate, ProductUpdate, 
    ProductFilter, ProductListResponse, ProductWithSeller
)
from app.services.product_service import ProductService
from app.db.mysql import get_db
from app.models.user import User
from app.dependencies import get_current_active_user

router = APIRouter()

@router.get("/", response_model=ProductListResponse)
async def get_all_products(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    category: Optional[str] = Query(None, description="Filter by category"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price"),
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
    product = ProductService.get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Product not found"
        )
    return ProductResponse.model_validate(product)

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
    """Update an existing product"""
    updated_product = ProductService.update_product(db, product_id, product_update, current_user.id)
    return ProductResponse.model_validate(updated_product)

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a product"""
    ProductService.delete_product(db, product_id, current_user.id)
    return

@router.patch("/{product_id}/mark-sold", response_model=ProductResponse)
async def mark_product_sold(
    product_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Mark a product as sold"""
    updated_product = ProductService.mark_product_sold(db, product_id, current_user.id)
    return ProductResponse.model_validate(updated_product)
