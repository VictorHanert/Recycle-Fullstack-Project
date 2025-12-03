"""Repository factory for creating repository instances."""
from sqlalchemy.orm import Session

from app.repositories.base import (
    UserRepositoryInterface, 
    ProductRepositoryInterface, 
    LocationRepositoryInterface
)
from app.repositories.user_repository import UserRepository
from app.repositories.product_repository import ProductRepository
from app.repositories.location_repository import LocationRepository


class RepositoryFactory:
    """Factory class for creating repository instances."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_user_repository(self) -> UserRepositoryInterface:
        """Get user repository instance."""
        return UserRepository(self.db)
    
    def get_product_repository(self) -> ProductRepositoryInterface:
        """Get product repository instance."""
        return ProductRepository(self.db)
    
    def get_location_repository(self) -> LocationRepositoryInterface:
        """Get location repository instance."""
        return LocationRepository(self.db)


# Convenience function for dependency injection
def get_repository_factory(db: Session) -> RepositoryFactory:
    """Get repository factory instance for dependency injection."""
    return RepositoryFactory(db)
