
from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from decimal import Decimal


# CREATE PRODUCT
class ProductCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    sku: str = Field(min_length=2, max_length=50)
    description: Optional[str] = None
    category_id: int = Field(gt=0)
    supplier_id: Optional[int] = Field(default=None, gt=0)
    min_stock: int = Field(default=5, ge=0)
    unit_price: Decimal = Field(default=0, ge=0)


# UPDATE PRODUCT
class ProductUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=150)
    description: Optional[str] = None
    category_id: Optional[int] = Field(default=None, gt=0)
    supplier_id: Optional[int] = Field(default=None, gt=0)
    min_stock: Optional[int] = Field(default=None, ge=0)
    unit_price: Optional[Decimal] = Field(default=None, ge=0)


# PRODUCT RESPONSE
class ProductResponse(BaseModel):
    id: int
    name: str
    sku: str
    description: Optional[str] = None
    category_id: int
    supplier_id: Optional[int] = None
    quantity: int
    min_stock: int
    unit_price: Decimal
    is_active: bool

    model_config = ConfigDict(from_attributes=True)
