"""Admin router for administrative operations."""
from math import ceil
from typing import List

from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.mysql import get_db
from app.dependencies import get_admin_user
from app.models.user import User
from app.models.product import Product
from app.models.favorites import Favorite
from app.models.item_views import ItemView
from app.models.price_history import ProductPriceHistory
from app.models.media import ProductImage
from app.services.auth_service import AuthService
from app.services.product_service import ProductService
from app.services.profile_service import ProfileService
from app.schemas.user import UserCreate, UserUpdate, UserResponse, UserListResponse
from app.schemas.product import ProductListResponse, ProductFilter, ProductCreate, ProductUpdate, ProductResponse

router = APIRouter()

# -- Admin user management (CRUD)
@router.get("/users", response_model=UserListResponse)
async def get_all_users(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(15, ge=1, le=100, description="Items per page"),
    search: str = Query(None, description="Search term for username, email, or full name"),
    _admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get all users (admin only)"""
    query = db.query(User)
    
    # Apply search filter if provided
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (User.username.ilike(search_filter)) |
            (User.email.ilike(search_filter)) |
            (User.full_name.ilike(search_filter))
        )
    
    # Get total count for pagination
    total = query.count()
    
    # Apply pagination
    skip = (page - 1) * size
    users = query.offset(skip).limit(size).all()
    
    # Calculate total pages
    total_pages = ceil(total / size) if total > 0 else 1
    
    return UserListResponse(
        users=[UserResponse.model_validate(user) for user in users],
        total=total,
        page=page,
        size=size,
        total_pages=total_pages
    )

@router.post("/users", response_model=UserResponse, status_code=201)
async def create_user_admin(
    user_in: UserCreate,
    _admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Create a new user (admin only). Uses AuthService to handle hashing and validation."""
    # Use AuthService.register_user to create (handles hashing/validation)
    new_user = AuthService.register_user(db, user_in)
    return UserResponse.model_validate(new_user)


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user_admin(
    user_id: int,
    _admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserResponse.model_validate(user)


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user_admin(
    user_id: int,
    user_update: UserUpdate,
    _admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    update_data = user_update.model_dump(exclude_unset=True)
    
    # Handle password separately - hash it if provided
    if 'password' in update_data:
        update_data['hashed_password'] = AuthService.get_password_hash(update_data.pop('password'))
    
    for field, value in update_data.items():
        setattr(user, field, value)

    from datetime import datetime, timezone
    user.updated_at = datetime.now(timezone.utc)

    try:
        db.commit()
        db.refresh(user)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to update user")

    return UserResponse.model_validate(user)


@router.delete("/users/{user_id}")
async def delete_user_admin(
    user_id: int,
    _admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Hard delete a user account and all related data (admin only)."""
    # Use ProfileService to handle the deletion logic
    ProfileService.delete_user_account(db, user_id)
    return {"message": "User and all related data deleted permanently"}


# -- Admin product management (CRUD)
@router.get("/products", response_model=ProductListResponse)
async def get_all_products_admin(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(50, ge=1, le=100, description="Items per page"),
    search: str = Query(None, description="Search term for product title or description"),
    include_sold: bool = Query(True, description="Include sold products"),
    _admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get all products including sold ones (admin only)"""
    skip = (page - 1) * size

    # Get all products for admin (including sold, paused, draft)
    filter_params = ProductFilter(status=None, min_price=None, max_price=None, search_term=search)  # Admin sees all products
    products, total = ProductService.get_products(db, skip=skip, limit=size, filter_params=filter_params)
    total_pages = ceil(total / size) if total > 0 else 1

    return ProductListResponse(
        products=[ProductResponse.model_validate(product) for product in products],
        total=total,
        page=page,
        size=size,
        total_pages=total_pages
    )

@router.post("/products", response_model=ProductResponse, status_code=201)
async def create_product_admin(
    product_in: ProductCreate,
    _admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Create a product as admin. Admin becomes the owner (seller_id set to admin user's id)."""
    product = ProductService.create_product(db, product_in, _admin_user.id)
    return ProductResponse.model_validate(product)


@router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product_admin(
    product_id: int,
    _admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    product = ProductService.get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return ProductResponse.model_validate(product)


@router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product_admin(
    product_id: int,
    product_update: ProductUpdate,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    updated = ProductService.update_product(db, product_id, product_update, admin_user.id)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found or update failed")
    return ProductResponse.model_validate(updated)


@router.delete("/products/{product_id}")
async def delete_product_admin(
    product_id: int,
    _admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    # Attempt to delete product (ProductService.delete_product enforces ownership; bypass by direct DB delete)
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    try:
        # Delete related records first to avoid foreign key constraints
        db.query(Favorite).filter(Favorite.product_id == product_id).delete()
        db.query(ItemView).filter(ItemView.product_id == product_id).delete()
        db.query(ProductPriceHistory).filter(ProductPriceHistory.product_id == product_id).delete()
        db.query(ProductImage).filter(ProductImage.product_id == product_id).delete()
        
        db.delete(product)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed to delete product: {e}")

    return {"message": "Product deleted"}

# -- Other Admin routes
@router.get("/stats")
async def get_platform_stats(
    _admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get platform statistics (admin only)"""
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

@router.get("/recent-activities")
async def get_recent_activities(
    _admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get recent activities (admin only)"""
    recent_activities = []
    return {"recent_activities": recent_activities}
