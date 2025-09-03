"""Product model for database operations."""
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import relationship

from app.db.mysql import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False, index=True)
    description = Column(String(1000), nullable=True)
    price = Column(Numeric(10, 2), nullable=False)  # Better for currency
    category = Column(String(100), nullable=False, index=True)
    seller_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_sold = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    # Relationship with user
    seller = relationship("User", back_populates="products")

    def __repr__(self):
        return (
            f"<Product(id={self.id}, title='{self.title}', "
            f"price={self.price}, seller_id={self.seller_id})>"
        )
