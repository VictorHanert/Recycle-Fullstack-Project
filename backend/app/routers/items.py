from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.schemas import Item, ItemCreate, ItemUpdate
from typing import List

router = APIRouter()
security = HTTPBearer()

# Mock items database (replace with real database later)
fake_items_db = {
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

@router.get("/", response_model=List[Item])
async def get_all_items():
    """Get all available items"""
    items = []
    for item_data in fake_items_db.values():
        if not item_data["is_sold"]:  # Only show unsold items
            items.append(Item(**item_data))
    return items

@router.get("/my-items", response_model=List[Item])
async def get_my_items(current_user_id: int = Depends(get_current_user_id)):
    """Get current user's items"""
    items = []
    for item_data in fake_items_db.values():
        if item_data["seller_id"] == current_user_id:
            items.append(Item(**item_data))
    return items

@router.get("/{item_id}", response_model=Item)
async def get_item(item_id: int):
    """Get specific item by ID"""
    item = fake_items_db.get(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return Item(**item)

@router.post("/", response_model=Item)
async def create_item(item: ItemCreate, current_user_id: int = Depends(get_current_user_id)):
    """Create a new item listing"""
    item_id = max(fake_items_db.keys()) + 1 if fake_items_db else 1
    
    new_item = {
        "id": item_id,
        "title": item.title,
        "description": item.description,
        "price": item.price,
        "category": item.category,
        "seller_id": current_user_id,
        "is_sold": False,
        "created_at": "2025-09-01T00:00:00",
        "updated_at": "2025-09-01T00:00:00"
    }
    
    fake_items_db[item_id] = new_item
    return Item(**new_item)

@router.put("/{item_id}", response_model=Item)
async def update_item(item_id: int, item_update: ItemUpdate, current_user_id: int = Depends(get_current_user_id)):
    """Update an existing item"""
    item = fake_items_db.get(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    if item["seller_id"] != current_user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this item")
    
    # Update only provided fields
    update_data = item_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        item[field] = value
    
    item["updated_at"] = "2025-09-01T00:00:00"
    fake_items_db[item_id] = item
    
    return Item(**item)

@router.delete("/{item_id}")
async def delete_item(item_id: int, current_user_id: int = Depends(get_current_user_id)):
    """Delete an item"""
    item = fake_items_db.get(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    if item["seller_id"] != current_user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this item")
    
    del fake_items_db[item_id]
    return {"message": "Item deleted successfully"}

@router.patch("/{item_id}/mark-sold")
async def mark_item_sold(item_id: int, current_user_id: int = Depends(get_current_user_id)):
    """Mark an item as sold"""
    item = fake_items_db.get(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    if item["seller_id"] != current_user_id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this item")
    
    item["is_sold"] = True
    item["updated_at"] = "2025-09-01T00:00:00"
    fake_items_db[item_id] = item
    
    return {"message": "Item marked as sold"}

@router.get("/category/{category}", response_model=List[Item])
async def get_items_by_category(category: str):
    """Get items by category"""
    items = []
    for item_data in fake_items_db.values():
        if not item_data["is_sold"] and item_data["category"].lower() == category.lower():
            items.append(Item(**item_data))
    return items
