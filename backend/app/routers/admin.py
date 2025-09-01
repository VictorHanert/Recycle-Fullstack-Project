from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.schemas.schemas import User, Product
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

@router.get("/products", response_model=List[Product])
async def admin_get_all_products(admin_user = Depends(get_current_admin_user)):
    """Admin: Get all products (including sold ones)"""
    from app.routers.products import fake_products_db
    
    products = []
    for product_data in fake_products_db.values():
        products.append(Product(**product_data))
    return products

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

