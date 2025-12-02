from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.services.auth_service import AuthService
from app.services.product_service import ProductService
from app.services.profile_service import ProfileService
from app.services.location_service import LocationService
from app.services.admin_service import AdminService
from app.services.message_service import MessageService
from app.db.mysql import get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.repositories.product_repository import ProductRepository
from app.repositories.location_repository import LocationRepository

security = HTTPBearer()
optional_security = HTTPBearer(auto_error=False)


# Repository Dependencies
def get_user_repository(db: Session = Depends(get_db)) -> UserRepository:
    """Get user repository instance"""
    return UserRepository(db)


def get_product_repository(db: Session = Depends(get_db)) -> ProductRepository:
    """Get product repository instance"""
    return ProductRepository(db)


def get_location_repository(db: Session = Depends(get_db)) -> LocationRepository:
    """Get location repository instance"""
    return LocationRepository(db)


# Service Dependencies
def get_auth_service(user_repo = Depends(get_user_repository)) -> AuthService:
    """Get auth service instance"""
    return AuthService(user_repo)


def get_product_service(
    product_repo = Depends(get_product_repository),
    user_repo = Depends(get_user_repository)
) -> ProductService:
    """Get product service instance"""
    return ProductService(product_repo, user_repo)


def get_profile_service(
    user_repo = Depends(get_user_repository),
    product_repo = Depends(get_product_repository),
    location_repo = Depends(get_location_repository)
) -> ProfileService:
    """Get profile service instance"""
    return ProfileService(user_repo, product_repo, location_repo)


def get_location_service(location_repo = Depends(get_location_repository)) -> LocationService:
    """Get location service instance"""
    return LocationService(location_repo)


def get_admin_service(db: Session = Depends(get_db)) -> AdminService:
    """Get admin service instance"""
    return AdminService(db)


def get_message_service(db: Session = Depends(get_db)) -> MessageService:
    """Get message service instance"""
    return MessageService(db)


# Authentication Dependencies
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service)
) -> User:
    """Get current authenticated user"""
    username = AuthService.verify_token(credentials.credentials)
    user = auth_service.get_user_by_username(username)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current active user"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user


async def get_admin_user(current_user: User = Depends(get_current_active_user)) -> User:
    """Get current admin user"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_security),
    auth_service: AuthService = Depends(get_auth_service)
) -> Optional[User]:
    """Get current user if authenticated, otherwise return None"""
    if not credentials:
        return None
    
    try:
        username = AuthService.verify_token(credentials.credentials)
        user = auth_service.get_user_by_username(username)
        if user and user.is_active:
            return user
    except HTTPException:
        pass
    
    return None
