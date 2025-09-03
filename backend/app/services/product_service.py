"""Service class for product operations."""
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy import and_, desc, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.models.product import Product
from app.models.user import User
from app.schemas.product import ProductCreate, ProductFilter, ProductUpdate


class ProductService:
    """Service class for product operations"""

    @staticmethod
    def create_product(db: Session, product: ProductCreate, seller_id: int) -> Product:
        """Create a new product listing"""
        try:
            db_product = Product(
                title=product.title,
                description=product.description,
                price=product.price,
                category=product.category,
                seller_id=seller_id,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )

            db.add(db_product)
            db.commit()
            db.refresh(db_product)
            return db_product

        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product creation failed due to database constraint"
            )

    @staticmethod
    def get_product_by_id(db: Session, product_id: int) -> Optional[Product]:
        """Get product by ID with seller information"""
        return db.query(Product).options(joinedload(Product.seller)).filter(Product.id == product_id).first()

    @staticmethod
    def get_products(
        db: Session,
        skip: int = 0,
        limit: int = 20,
        filter_params: Optional[ProductFilter] = None
    ) -> tuple[List[Product], int]:
        """Get products with filtering and pagination"""
        query = db.query(Product).options(joinedload(Product.seller))

        # Apply filters
        if filter_params:
            if filter_params.category:
                query = query.filter(Product.category.ilike(f"%{filter_params.category}%"))

            if filter_params.min_price is not None:
                query = query.filter(Product.price >= filter_params.min_price)

            if filter_params.max_price is not None:
                query = query.filter(Product.price <= filter_params.max_price)

            if filter_params.is_sold is not None:
                query = query.filter(Product.is_sold == filter_params.is_sold)

            if filter_params.search_term:
                search = f"%{filter_params.search_term}%"
                query = query.filter(
                    or_(
                        Product.title.ilike(search),
                        Product.description.ilike(search)
                    )
                )

        # Get total count for pagination
        total = query.count()

        # Apply pagination and ordering
        products = query.order_by(desc(Product.created_at)).offset(skip).limit(limit).all()

        return products, total

    @staticmethod
    def get_products_by_seller(db: Session, seller_id: int, skip: int = 0, limit: int = 20) -> tuple[List[Product], int]:
        """Get products by seller with pagination"""
        query = db.query(Product).filter(Product.seller_id == seller_id)
        total = query.count()
        products = query.order_by(desc(Product.created_at)).offset(skip).limit(limit).all()
        return products, total

    @staticmethod
    def get_products_by_category(db: Session, category: str, skip: int = 0, limit: int = 20) -> tuple[List[Product], int]:
        """Get products by category with pagination"""
        query = db.query(Product).filter(
            and_(
                Product.category.ilike(f"%{category}%"),
                Product.is_sold == False
            )
        ).options(joinedload(Product.seller))

        total = query.count()
        products = query.order_by(desc(Product.created_at)).offset(skip).limit(limit).all()
        return products, total

    @staticmethod
    def update_product(db: Session, product_id: int, product_update: ProductUpdate, user_id: int) -> Product:
        """Update an existing product"""
        product = db.query(Product).filter(Product.id == product_id).first()

        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )

        # Check if user owns the product
        if product.seller_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this product"
            )

        # Update only provided fields
        update_data = product_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(product, field, value)

        product.updated_at = datetime.now(timezone.utc)

        try:
            db.commit()
            db.refresh(product)
            return product
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product update failed due to database constraint"
            )

    @staticmethod
    def delete_product(db: Session, product_id: int, user_id: int) -> bool:
        """Delete a product"""
        product = db.query(Product).filter(Product.id == product_id).first()

        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )

        # Check if user owns the product
        if product.seller_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this product"
            )

        try:
            db.delete(product)
            db.commit()
            return True
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product deletion failed due to database constraint"
            )

    @staticmethod
    def mark_product_sold(db: Session, product_id: int, user_id: int) -> Product:
        """Mark a product as sold"""
        product = db.query(Product).filter(Product.id == product_id).first()

        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )

        # Check if user owns the product
        if product.seller_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to modify this product"
            )

        product.is_sold = True
        product.updated_at = datetime.now(timezone.utc)

        try:
            db.commit()
            db.refresh(product)
            return product
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product status update failed"
            )
