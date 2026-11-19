
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# CREATE SUPPLIER
class SupplierCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(default=None, max_length=20)
    address: Optional[str] = Field(default=None, max_length=255)


# UPDATE SUPPLIER
class SupplierUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=150)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(default=None, max_length=20)
    address: Optional[str] = Field(default=None, max_length=255)


# SUPPLIER RESPONSE
class SupplierResponse(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
