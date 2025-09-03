"""Product schemas for request/response validation."""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List

from pydantic import BaseModel, ConfigDict, Field


class SellerInfo(BaseModel):
    """Schema for seller information in products"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    username: str
    email: str


class LocationInfo(BaseModel):
    """Schema for location information in products"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    city: str
    postcode: str


class ProductImageInfo(BaseModel):
    """Schema for product image information"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    url: str
    sort_order: int


class ProductBase(BaseModel):
    """Base product schema with common fields"""
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    price_amount: Decimal = Field(..., gt=0, decimal_places=2)
    category: str = Field(..., min_length=1, max_length=100)


class ProductCreate(ProductBase):
    """Schema for product creation"""
    pass


class ProductUpdate(BaseModel):
    """Schema for product updates"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    price_amount: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    category: Optional[str] = Field(None, min_length=1, max_length=100)


class ProductResponse(BaseModel):
    """Schema for product response"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: Optional[str] = None
    price_amount: Decimal
    price_currency: Optional[str] = "USD"
    category_id: int
    condition: str
    quantity: int
    likes_count: int
    status: str
    seller_id: int
    location_id: Optional[int] = None
    is_sold: bool = False
    created_at: datetime
    updated_at: datetime
    
    # Nested relationships
    seller: Optional[SellerInfo] = None
    location: Optional[LocationInfo] = None
    images: List[ProductImageInfo] = []


class ProductWithSeller(ProductResponse):
    """Schema for product with seller information"""
    seller_username: str
    seller_email: str


# Search and filter schemas
class ProductFilter(BaseModel):
    """Schema for product filtering"""
    category: Optional[str] = None
    min_price: Optional[Decimal] = Field(None, ge=0)
    max_price: Optional[Decimal] = Field(None, ge=0)
    is_sold: Optional[bool] = None
    search_term: Optional[str] = Field(None, max_length=100)


class ProductListResponse(BaseModel):
    """Schema for paginated product list response"""
    products: list[ProductResponse]
    total: int
    page: int
    size: int
    total_pages: int
