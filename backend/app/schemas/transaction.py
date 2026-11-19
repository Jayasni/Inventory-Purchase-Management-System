
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator


class TransactionCreate(BaseModel):
    product_id: int = Field(gt=0)

    transaction_type: Literal[
        "receipt",
        "issue",
        "adjustment"
    ]

    quantity: int = Field(ge=0)
    reference_type: Optional[str] = Field(
        default=None,
        max_length=30
    )
    reference_id: Optional[int] = Field(
        default=None,
        gt=0
    )
    notes: Optional[str] = None

    @model_validator(mode="after")
    def validate_transaction_quantity(self):
        if self.transaction_type in ("receipt", "issue") and self.quantity <= 0:
            raise ValueError("Receipt and issue quantities must be greater than zero")
        return self


class TransactionResponse(BaseModel):
    id: int
    product_id: int
    user_id: int
    transaction_type: str
    quantity: int
    reference_type: Optional[str] = None
    reference_id: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
