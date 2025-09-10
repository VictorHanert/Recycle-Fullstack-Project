"""Service class for product operations."""
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy import and_, desc, asc, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.models.product import Product
from app.models.user import User
from app.models.price_history import ProductPriceHistory
from app.models.product_details import Color, Material, Tag
from app.models.media import ProductImage
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
                price_amount=product.price_amount,
                price_currency=product.price_currency,
                category_id=product.category_id,
                condition=product.condition or "new",
                quantity=product.quantity or 1,
                price_type="fixed",
                status="active",
                location_id=product.location_id or 1,  # Default location
                width_cm=product.width_cm,
                height_cm=product.height_cm,
                depth_cm=product.depth_cm,
                weight_kg=product.weight_kg,
                seller_id=seller_id,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )

            db.add(db_product)
            db.commit()
            db.refresh(db_product)

            # Handle many-to-many relationships
            if product.color_ids:
                from app.models.product_details import Color
                colors = db.query(Color).filter(Color.id.in_(product.color_ids)).all()
                db_product.colors.extend(colors)

            if product.material_ids:
                from app.models.product_details import Material
                materials = db.query(Material).filter(Material.id.in_(product.material_ids)).all()
                db_product.materials.extend(materials)

            if product.tag_ids:
                from app.models.product_details import Tag
                tags = db.query(Tag).filter(Tag.id.in_(product.tag_ids)).all()
                db_product.tags.extend(tags)

            # Handle images
            if product.image_urls:
                from app.models.media import ProductImage
                for i, image_url in enumerate(product.image_urls):
                    image = ProductImage(
                        product_id=db_product.id,
                        url=image_url,
                        sort_order=i
                    )
                    db.add(image)

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
            joinedload(Product.price_changes),
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
        base['price_changes'] = product.price_changes or []
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
                # Filter by category name (for backward compatibility)
                from app.models.category import Category
                query = query.join(Category, Product.category_id == Category.id)
                query = query.filter(Category.name.ilike(f"%{filter_params.category}%"))

            if filter_params.min_price is not None:
                query = query.filter(Product.price_amount >= filter_params.min_price)

            if filter_params.max_price is not None:
                query = query.filter(Product.price_amount <= filter_params.max_price)

            if filter_params.location_id is not None:
                query = query.filter(Product.location_id == filter_params.location_id)

            if filter_params.condition:
                query = query.filter(Product.condition.ilike(f"%{filter_params.condition}%"))

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

        # Apply sorting
        if filter_params and filter_params.sort_by:
            if filter_params.sort_by == "newest":
                query = query.order_by(desc(Product.created_at))
            elif filter_params.sort_by == "oldest":
                query = query.order_by(asc(Product.created_at))
            elif filter_params.sort_by == "price_low":
                query = query.order_by(asc(Product.price_amount))
            elif filter_params.sort_by == "price_high":
                query = query.order_by(desc(Product.price_amount))
            elif filter_params.sort_by == "title":
                query = query.order_by(asc(Product.title))
            else:
                query = query.order_by(desc(Product.created_at))
        else:
            # Default sorting
            query = query.order_by(desc(Product.created_at))

        # Get total count for pagination
        total = query.count()

        # Apply pagination
        products = query.offset(skip).limit(limit).all()

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
        from app.models.category import Category
        query = db.query(Product).join(Category, Product.category_id == Category.id).filter(
            and_(
                Category.name.ilike(f"%{category}%"),
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

        # Check if price has changed and create price history entry
        update_data = product_update.model_dump(exclude_unset=True)
        price_changed = False

        if 'price_amount' in update_data or 'price_currency' in update_data:
            # Check if price actually changed
            new_amount = update_data.get('price_amount', product.price_amount)
            new_currency = update_data.get('price_currency', product.price_currency)

            if new_amount != product.price_amount or new_currency != product.price_currency:
                # Create price history entry
                price_history = ProductPriceHistory(
                    product_id=product_id,
                    amount=new_amount,
                    currency=new_currency
                )
                db.add(price_history)
                price_changed = True

        # Handle many-to-many relationships
        if 'color_ids' in update_data:
            # Clear existing colors and add new ones
            product.colors.clear()
            if update_data['color_ids']:
                colors = db.query(Color).filter(Color.id.in_(update_data['color_ids'])).all()
                product.colors.extend(colors)
            update_data.pop('color_ids')

        if 'material_ids' in update_data:
            # Clear existing materials and add new ones
            product.materials.clear()
            if update_data['material_ids']:
                materials = db.query(Material).filter(Material.id.in_(update_data['material_ids'])).all()
                product.materials.extend(materials)
            update_data.pop('material_ids')

        if 'tag_ids' in update_data:
            # Clear existing tags and add new ones
            product.tags.clear()
            if update_data['tag_ids']:
                tags = db.query(Tag).filter(Tag.id.in_(update_data['tag_ids'])).all()
                product.tags.extend(tags)
            update_data.pop('tag_ids')

        if 'image_urls' in update_data:
            # Replace all images with the new list
            # First, delete all existing images
            db.query(ProductImage).filter(ProductImage.product_id == product_id).delete()
            
            # Then add the new images
            if update_data['image_urls']:
                for i, image_url in enumerate(update_data['image_urls']):
                    new_image = ProductImage(
                        product_id=product_id,
                        url=image_url,
                        sort_order=i + 1
                    )
                    db.add(new_image)
            update_data.pop('image_urls')

        # Update only provided fields
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
