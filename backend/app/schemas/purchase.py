
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime

class PurchaseItemCreate(BaseModel):
    product_id: int = Field(gt=0)
    quantity: int = Field(gt=0)
    unit_price: Decimal = Field(
        ge=0,
        max_digits=12,
        decimal_places=2
    )


class PurchaseCreate(BaseModel):
    supplier_id: int = Field(gt=0)
    items: list[PurchaseItemCreate] = Field(min_length=1)


class PurchaseItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: Decimal

    model_config = ConfigDict(from_attributes=True)


class PurchaseUpdate(BaseModel):
    status: Literal[
        "draft",
        "ordered",
        "received",
        "cancelled"
    ]


class PurchaseResponse(BaseModel):
    id: int
    supplier_id: int
    created_by_id: int
    total_amount: Decimal
    status: str
    created_at: datetime
    items: list[PurchaseItemResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
