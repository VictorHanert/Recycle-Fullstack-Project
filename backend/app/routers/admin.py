"""Admin router for administrative operations."""
from math import ceil
from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.mysql import get_db
from app.dependencies import get_admin_user
from app.models.user import User
from app.schemas.product import ProductListResponse, ProductResponse
from app.schemas.user import UserResponse
from app.services.auth_service import AuthService
from app.services.product_service import ProductService

router = APIRouter()

@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(50, ge=1, le=100, description="Items per page"),
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get all users (admin only)"""
    skip = (page - 1) * size
    users = db.query(User).offset(skip).limit(size).all()
    return [UserResponse.model_validate(user) for user in users]

@router.get("/products", response_model=ProductListResponse)
async def get_all_products_admin(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(50, ge=1, le=100, description="Items per page"),
    include_sold: bool = Query(True, description="Include sold products"),
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get all products including sold ones (admin only)"""
    skip = (page - 1) * size

    # Get all products for admin (including sold)
    from app.schemas.product import ProductFilter
    filter_params = ProductFilter(is_sold=None if include_sold else False)
    products, total = ProductService.get_products(db, skip=skip, limit=size, filter_params=filter_params)
    total_pages = ceil(total / size) if total > 0 else 1

    return ProductListResponse(
        products=[ProductResponse.model_validate(product) for product in products],
        total=total,
        page=page,
        size=size,
        total_pages=total_pages
    )

@router.get("/stats")
async def get_platform_stats(
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get platform statistics (admin only)"""
    from app.models.product import Product

    total_users = db.query(User).count()
    total_products = db.query(Product).count()
    sold_products = db.query(Product).filter(Product.status == "sold").count()
    active_products = total_products - sold_products
    revenue_from_sold_products = db.query(func.sum(Product.price_amount)).filter(Product.status == "sold").scalar() or 0

    return {
        "total_users": total_users,
        "total_products": total_products,
        "sold_products": sold_products,
        "active_products": active_products,
        "conversion_rate": round((sold_products / total_products * 100) if total_products > 0 else 0, 2),
        "revenue_from_sold_products": revenue_from_sold_products
    }
