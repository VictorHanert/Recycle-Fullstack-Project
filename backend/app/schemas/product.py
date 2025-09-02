from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from decimal import Decimal


class ProductBase(BaseModel):
    """Base product schema with common fields"""
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    price: Decimal = Field(..., gt=0, decimal_places=2)
    category: str = Field(..., min_length=1, max_length=100)


class ProductCreate(ProductBase):
    """Schema for product creation"""
    pass


class ProductUpdate(BaseModel):
    """Schema for product updates"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    price: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    category: Optional[str] = Field(None, min_length=1, max_length=100)


class ProductResponse(ProductBase):
    """Schema for product response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    seller_id: int
    is_sold: bool = False
    created_at: datetime
    updated_at: datetime


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
