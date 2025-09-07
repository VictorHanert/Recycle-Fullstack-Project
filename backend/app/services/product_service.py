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

    @staticmethod
    def get_all_details(db: Session):
        """Fetch all colors, materials, and tags for product details dropdowns/filters."""
        from app.models.product_details import Color, Material, Tag
        colors = db.query(Color).order_by(Color.name).all()
        materials = db.query(Material).order_by(Material.name).all()
        tags = db.query(Tag).order_by(Tag.name).all()
        return {
            "colors": colors,
            "materials": materials,
            "tags": tags
        }
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
    def get_product_by_id(db: Session, product_id: int) -> Optional[dict]:
        """Get product by ID with all details and counters"""
        product = db.query(Product).options(
            joinedload(Product.seller),
            joinedload(Product.location),
            joinedload(Product.images),
            joinedload(Product.colors),
            joinedload(Product.materials),
            joinedload(Product.tags),
            joinedload(Product.favorites),
            joinedload(Product.views),
        ).filter(Product.id == product_id).first()
        if not product:
            return None
        # Build dict for ProductResponse
        return ProductService._build_product_response_dict(product)

    @staticmethod
    def _build_product_response_dict(product: Product) -> dict:
        # Use model_dump for base fields, then add details/counters
        base = product.__dict__.copy()
        # Remove SQLAlchemy state
        base.pop('_sa_instance_state', None)
        # Add nested relationships
        base['seller'] = product.seller
        base['location'] = product.location
        base['images'] = product.images
        # Add details and counters
        base['views_count'] = len(product.views) if product.views else 0
        base['favorites_count'] = len(product.favorites) if product.favorites else 0
        base['colors'] = product.colors or []
        base['materials'] = product.materials or []
        base['tags'] = product.tags or []
        return base

    @staticmethod
    def get_products(
        db: Session,
        skip: int = 0,
        limit: int = 20,
        filter_params: Optional[ProductFilter] = None
    ) -> tuple[List[Product], int]:
        """Get products with filtering and pagination"""
        query = db.query(Product).options(
            joinedload(Product.seller),
            joinedload(Product.location),
            joinedload(Product.images)
        )

        # Apply filters
        if filter_params:
            if filter_params.category:
                query = query.filter(Product.category.ilike(f"%{filter_params.category}%"))

            if filter_params.min_price is not None:
                query = query.filter(Product.price_amount >= filter_params.min_price)

            if filter_params.max_price is not None:
                query = query.filter(Product.price_amount <= filter_params.max_price)

            if filter_params.is_sold is not None:
                if filter_params.is_sold:
                    query = query.filter(Product.status == "sold")
                else:
                    query = query.filter(Product.status != "sold")

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
        query = db.query(Product).filter(Product.seller_id == seller_id).options(
            joinedload(Product.seller),
            joinedload(Product.location),
            joinedload(Product.images)
        )
        total = query.count()
        products = query.order_by(desc(Product.created_at)).offset(skip).limit(limit).all()
        return products, total

    @staticmethod
    def get_products_by_category(db: Session, category: str, skip: int = 0, limit: int = 20) -> tuple[List[Product], int]:
        """Get products by category with pagination"""
        query = db.query(Product).filter(
            and_(
                Product.category.ilike(f"%{category}%"),
                Product.status != "sold"
            )
        ).options(
            joinedload(Product.seller),
            joinedload(Product.location),
            joinedload(Product.images)
        )

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

        product.status = "sold"
        product.sold_at = datetime.now(timezone.utc)
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
