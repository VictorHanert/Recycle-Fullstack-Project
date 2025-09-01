from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.schemas import UserCreate, UserLogin, User, Token
from typing import List

router = APIRouter()
security = HTTPBearer()

# Mock user database (replace with real database later)
fake_users_db = {
    "admin": {
        "id": 1,
        "username": "admin",
        "email": "admin@marketplace.com",
        "full_name": "Admin User",
        "hashed_password": "fake_hashed_password",
        "is_active": True,
        "is_admin": True
    }
}

@router.post("/register", response_model=User)
async def register_user(user: UserCreate):
    """Register a new user"""
    if user.username in fake_users_db:
        raise HTTPException(
            status_code=400,
            detail="Username already registered"
        )
    
    # Mock user creation (replace with real database logic)
    new_user = {
        "id": len(fake_users_db) + 1,
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "hashed_password": f"hashed_{user.password}",
        "is_active": True,
        "is_admin": False
    }
    
    fake_users_db[user.username] = new_user
    
    return User(
        id=new_user["id"],
        username=new_user["username"],
        email=new_user["email"],
        full_name=new_user["full_name"],
        is_active=new_user["is_active"],
        is_admin=new_user["is_admin"],
        created_at="2025-09-01T00:00:00"
    )

@router.post("/login", response_model=Token)
async def login_user(user_credentials: UserLogin):
    """Login user and return access token"""
    user = fake_users_db.get(user_credentials.username)
    
    if not user or user["hashed_password"] != f"hashed_{user_credentials.password}":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Mock token creation (replace with real JWT token)
    access_token = f"fake_token_for_{user['username']}"
    
    return Token(access_token=access_token, token_type="bearer")

@router.get("/me", response_model=User)
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user information"""
    # Mock token verification (replace with real JWT verification)
    username = credentials.credentials.replace("fake_token_for_", "")
    
    user = fake_users_db.get(username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return User(
        id=user["id"],
        username=user["username"],
        email=user["email"],
        full_name=user["full_name"],
        is_active=user["is_active"],
        is_admin=user["is_admin"],
        created_at="2025-09-01T00:00:00"
    )

@router.get("/users", response_model=List[User])
async def get_all_users():
    """Get all users (for testing purposes)"""
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
