from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.schemas import User, Item
from typing import List

router = APIRouter()
security = HTTPBearer()

def get_current_admin_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify that the current user is an admin"""
    # Mock admin verification (replace with real implementation)
    username = credentials.credentials.replace("fake_token_for_", "")
    
    # Import fake_users_db from auth router (in real app, use a shared service)
    from app.routers.auth import fake_users_db
    
    user = fake_users_db.get(username)
    if not user or not user.get("is_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return user

@router.get("/users", response_model=List[User])
async def admin_get_all_users(admin_user = Depends(get_current_admin_user)):
    """Admin: Get all users"""
    from app.routers.auth import fake_users_db
    
    users = []
    for user_data in fake_users_db.values():
        users.append(User(
            id=user_data["id"],
            username=user_data["username"],
            email=user_data["email"],
            full_name=user_data["full_name"],
            is_active=user_data["is_active"],
            is_admin=user_data["is_admin"],
            created_at="2025-09-01T00:00:00"
        ))
    return users

@router.get("/items", response_model=List[Item])
async def admin_get_all_items(admin_user = Depends(get_current_admin_user)):
    """Admin: Get all items (including sold ones)"""
    from app.routers.items import fake_items_db
    
    items = []
    for item_data in fake_items_db.values():
        items.append(Item(**item_data))
    return items

@router.delete("/users/{user_id}")
async def admin_delete_user(user_id: int, admin_user = Depends(get_current_admin_user)):
    """Admin: Delete a user"""
    from app.routers.auth import fake_users_db
    
    # Find user by ID
    user_to_delete = None
    username_to_delete = None
    
    for username, user_data in fake_users_db.items():
        if user_data["id"] == user_id:
            user_to_delete = user_data
            username_to_delete = username
            break
    
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_to_delete["is_admin"]:
        raise HTTPException(status_code=400, detail="Cannot delete admin user")
    
    if username_to_delete:
        del fake_users_db[username_to_delete]
        return {"message": f"User {username_to_delete} deleted successfully"}
    else:
        raise HTTPException(status_code=404, detail="User not found")

@router.delete("/items/{item_id}")
async def admin_delete_item(item_id: int, admin_user = Depends(get_current_admin_user)):
    """Admin: Delete any item"""
    from app.routers.items import fake_items_db
    
    if item_id not in fake_items_db:
        raise HTTPException(status_code=404, detail="Item not found")
    
    del fake_items_db[item_id]
    return {"message": "Item deleted successfully"}

@router.patch("/users/{user_id}/toggle-active")
async def admin_toggle_user_active(user_id: int, admin_user = Depends(get_current_admin_user)):
    """Admin: Toggle user active status"""
    from app.routers.auth import fake_users_db
    
    # Find user by ID
    user_to_toggle = None
    for user_data in fake_users_db.values():
        if user_data["id"] == user_id:
            user_to_toggle = user_data
            break
    
    if not user_to_toggle:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_to_toggle["is_active"] = not user_to_toggle["is_active"]
    status_text = "activated" if user_to_toggle["is_active"] else "deactivated"
    
    return {"message": f"User {status_text} successfully"}

@router.get("/stats")
async def admin_get_stats(admin_user = Depends(get_current_admin_user)):
    """Admin: Get platform statistics"""
    from app.routers.auth import fake_users_db
    from app.routers.items import fake_items_db
    
    total_users = len(fake_users_db)
    active_users = sum(1 for user in fake_users_db.values() if user["is_active"])
    total_items = len(fake_items_db)
    sold_items = sum(1 for item in fake_items_db.values() if item["is_sold"])
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_items": total_items,
        "available_items": total_items - sold_items,
        "sold_items": sold_items
    }
