from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.schemas.schemas import Product, ProductCreate, ProductUpdate
from typing import List

router = APIRouter()
security = HTTPBearer()

# Mock products database (replace with real database later)
fake_products_db = {
    1: {
        "id": 1,
        "title": "iPhone 15",
        "description": "Brand new iPhone 15 in excellent condition",
        "price": 899.99,
        "category": "Electronics",
        "seller_id": 1,
        "is_sold": False,
        "created_at": "2025-09-01T00:00:00",
        "updated_at": "2025-09-01T00:00:00"
    },
    2: {
        "id": 2,
        "title": "Vintage Bike",
        "description": "Classic road bike from the 80s",
        "price": 250.00,
        "category": "Sports",
        "seller_id": 1,
        "is_sold": False,
        "created_at": "2025-09-01T00:00:00",
        "updated_at": "2025-09-01T00:00:00"
    }
}

def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> int:
    """Mock function to get current user ID from token"""
    # In real implementation, decode JWT token here
    return 1  # Mock user ID

@router.get("/", response_model=List[Product])
async def get_all_products():
    """Get all available products"""
    products = []
    for product_data in fake_products_db.values():
        if not product_data["is_sold"]:  # Only show unsold products
            products.append(Product(**product_data))
    return products

@router.get("/my-products", response_model=List[Product])
async def get_my_products(current_user_id: int = Depends(get_current_user_id)):
    """Get products posted by the current user"""
    user_products = []
    for product_data in fake_products_db.values():
        if product_data["seller_id"] == current_user_id:
            user_products.append(Product(**product_data))
    return user_products

@router.get("/{product_id}", response_model=Product)
async def get_product(product_id: int):
    """Get a specific product by ID"""
    product = fake_products_db.get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        return Product(**product)

@router.post("/", response_model=Product)
async def create_product(product: ProductCreate, current_user_id: int = Depends(get_current_user_id)):
    """Create a new product listing"""
    product_id = max(fake_products_db.keys()) + 1 if fake_products_db else 1
    
    new_product = {
        "id": product_id,
        "title": product.title,
        "description": product.description,
        "price": product.price,
        "category": product.category,
        "seller_id": current_user_id,
        "is_sold": False,
        "created_at": "2025-09-01T00:00:00",
        "updated_at": "2025-09-01T00:00:00"
    }
    
    fake_products_db[product_id] = new_product
    return Product(**new_product)

@router.put("/{product_id}", response_model=Product)
async def update_product(product_id: int, product_update: ProductUpdate, current_user_id: int = Depends(get_current_user_id)):
    """Update an existing product"""
    product = fake_products_db.get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product["seller_id"] != current_user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this product")
    
    # Update only provided fields
    update_data = product_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        product[field] = value
    
    product["updated_at"] = "2025-09-01T00:00:00"
    fake_products_db[product_id] = product

    return Product(**product)

@router.delete("/{product_id}")
async def delete_product(product_id: int, current_user_id: int = Depends(get_current_user_id)):
    """Delete a product"""
    product = fake_products_db.get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product["seller_id"] != current_user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this product")
    
    del fake_products_db[product_id]
    return {"message": "Product deleted successfully"}

@router.patch("/{product_id}/mark-sold")
async def mark_product_sold(product_id: int, current_user_id: int = Depends(get_current_user_id)):
    """Mark a product as sold"""
    product = fake_products_db.get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product["seller_id"] != current_user_id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this product")
    
    product["is_sold"] = True
    product["updated_at"] = "2025-09-01T00:00:00"
    fake_products_db[product_id] = product
    
    return {"message": "Product marked as sold"}

@router.get("/category/{category}", response_model=List[Product])
async def get_products_by_category(category: str):
    """Get products by category"""
    products = []
    for product_data in fake_products_db.values():
        if not product_data["is_sold"] and product_data["category"].lower() == category.lower():
            products.append(Product(**product_data))
    return products
