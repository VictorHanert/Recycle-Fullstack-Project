"""Service class for product operations."""
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy import and_, desc, asc, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.product import Product
from app.models.user import User
from app.models.price_history import ProductPriceHistory
from app.models.product_details import Color, Material, Tag
from app.models.media import ProductImage
from app.schemas.product import ProductCreate, ProductFilter, ProductUpdate, ProductResponse
from app.models.item_views import ItemView
from app.models.favorites import Favorite
from app.models.category import Category

# Common loading options for different query types
PRODUCT_LIST_LOAD_OPTIONS = [
    joinedload(Product.seller),
    joinedload(Product.location),
    selectinload(Product.images)
]

PRODUCT_DETAIL_LOAD_OPTIONS = [
    joinedload(Product.seller),
    joinedload(Product.location),
    selectinload(Product.images),
    selectinload(Product.colors),
    selectinload(Product.materials),
    selectinload(Product.tags),
    selectinload(Product.favorites),
    selectinload(Product.views),
    selectinload(Product.price_changes),
]


class ProductService:

    @staticmethod
    def get_all_details(db: Session):
        """Fetch all colors, materials, and tags for product details dropdowns/filters."""
        colors = db.query(Color).order_by(Color.name).all()
        materials = db.query(Material).order_by(Material.name).all()
        tags = db.query(Tag).order_by(Tag.name).all()
        return {
            "colors": colors,
            "materials": materials,
            "tags": tags
        }

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

            # Create initial price history entry
            if product.price_amount is not None:
                initial_price_history = ProductPriceHistory(
                    product_id=db_product.id,
                    amount=product.price_amount,
                    currency=product.price_currency
                )
                db.add(initial_price_history)

            # Handle many-to-many relationships
            if product.color_ids:
                colors = db.query(Color).filter(Color.id.in_(product.color_ids)).all()
                db_product.colors.extend(colors)

            if product.material_ids:
                materials = db.query(Material).filter(Material.id.in_(product.material_ids)).all()
                db_product.materials.extend(materials)

            if product.tag_ids:
                tags = db.query(Tag).filter(Tag.id.in_(product.tag_ids)).all()
                db_product.tags.extend(tags)

            # Handle images
            if product.image_urls:
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
    def get_product_by_id(db: Session, product_id: int, current_user_id: Optional[int] = None) -> Optional[ProductResponse]:
        """Get product by ID with all details and counters"""
        product = db.query(Product).options(*PRODUCT_DETAIL_LOAD_OPTIONS).filter(Product.id == product_id).first()
        
        if not product:
            return None
        
        # Check if user can access this product
        if current_user_id != product.seller_id:  # Not the owner
            if product.status not in ['active', 'sold']:
                return None  # Deny access to paused/draft products
        
        # Record view for authenticated users (not the seller)
        if current_user_id and current_user_id != product.seller_id:
            
            # Check if user already viewed this product
            existing_view = db.query(ItemView).filter(
                ItemView.product_id == product_id,
                ItemView.viewer_user_id == current_user_id
            ).first()
            
            if not existing_view:
                # Create new view record (datetime is auto-generated by model)
                new_view = ItemView(
                    product_id=product_id,
                    viewer_user_id=current_user_id
                )
                db.add(new_view)
                db.commit()
                
                # Re-query with all relationships to ensure we have updated data
                product = db.query(Product).options(*PRODUCT_DETAIL_LOAD_OPTIONS).filter(Product.id == product_id).first()
        
        # Use Pydantic schema for response
        product_response = ProductResponse.model_validate(product)
        product_response.views_count = len(product.views)
        product_response.favorites_count = len(product.favorites)
        return product_response

    @staticmethod
    def get_products(
        db: Session,
        skip: int = 0,
        limit: int = 20,
        filter_params: Optional[ProductFilter] = None
    ) -> tuple[List[Product], int]:
        """Get products with filtering and pagination"""
        query = db.query(Product).options(*PRODUCT_LIST_LOAD_OPTIONS)

        # Apply filters
        if filter_params:
            if filter_params.category:
                # Filter by category name (for backward compatibility)
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

            if filter_params.status is not None:
                if filter_params.status == "sold":
                    query = query.filter(Product.status == "sold")
                elif filter_params.status == "active":
                    query = query.filter(Product.status == "active")
                else:
                    # For other status values, filter exactly
                    query = query.filter(Product.status == filter_params.status)

            if filter_params.search_term:
                search = f"%{filter_params.search_term}%"
                query = query.filter(
                    or_(
                        Product.title.ilike(search),
                        Product.description.ilike(search)
                    )
                )

        # Apply sorting
        sort_options = {
            "newest": desc(Product.created_at),
            "oldest": asc(Product.created_at),
            "price_low": asc(Product.price_amount),
            "price_high": desc(Product.price_amount),
            "title": asc(Product.title)
        }
        
        if filter_params and filter_params.sort_by:
            query = query.order_by(sort_options.get(filter_params.sort_by, desc(Product.created_at)))
        else:
            # Default sorting
            query = query.order_by(desc(Product.created_at))

        # Get total count for pagination
        total = query.count()

        # Apply pagination
        products = query.offset(skip).limit(limit).all()

        # Set computed counts
        for p in products:
            p.views_count = len(p.views)
            p.favorites_count = len(p.favorites)

        return products, total

    @staticmethod
    def get_products_by_seller(db: Session, seller_id: int, skip: int = 0, limit: int = 20) -> tuple[List[Product], int]:
        """Get products by seller with pagination"""
        query = db.query(Product).filter(Product.seller_id == seller_id).options(*PRODUCT_LIST_LOAD_OPTIONS)
        total = query.count()
        products = query.order_by(desc(Product.created_at)).offset(skip).limit(limit).all()
        # Set computed counts
        for p in products:
            p.views_count = len(p.views)
            p.favorites_count = len(p.favorites)
        return products, total

    @staticmethod
    def get_products_by_category(db: Session, category: str, skip: int = 0, limit: int = 20) -> tuple[List[Product], int]:
        """Get products by category with pagination"""
        query = db.query(Product).join(Category, Product.category_id == Category.id).filter(
            and_(
                Category.name.ilike(f"%{category}%"),
                Product.status == "active"
            )
        ).options(*PRODUCT_LIST_LOAD_OPTIONS)

        total = query.count()
        products = query.order_by(desc(Product.created_at)).offset(skip).limit(limit).all()
        # Set computed counts
        for p in products:
            p.views_count = len(p.views)
            p.favorites_count = len(p.favorites)
        return products, total

    @staticmethod
    def update_product(db: Session, product_id: int, product_update: ProductUpdate, user_id: int, is_admin: bool = False) -> Product:
        """Update an existing product"""
        product = db.query(Product).filter(Product.id == product_id).first()

        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )

        # Check if user owns the product (skip for admin)
        if not is_admin and product.seller_id != user_id:
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

        # Handle status changes
        if 'status' in update_data:
            new_status = update_data['status']
            if new_status == 'sold':
                product.sold_at = datetime.now(timezone.utc)
            elif product.status == 'sold' and new_status != 'sold':
                # Clear sold_at when changing from sold to something else
                product.sold_at = None

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
            # Delete related records first to avoid foreign key constraints
            db.query(Favorite).filter(Favorite.product_id == product_id).delete()
            db.query(ItemView).filter(ItemView.product_id == product_id).delete()
            db.query(ProductPriceHistory).filter(ProductPriceHistory.product_id == product_id).delete()
            db.query(ProductImage).filter(ProductImage.product_id == product_id).delete()
            
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
