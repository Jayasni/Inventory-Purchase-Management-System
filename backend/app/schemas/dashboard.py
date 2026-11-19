
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class DashboardSummary(BaseModel):
    total_products: int
    total_suppliers: int
    total_categories: int
    total_stock_units: int
    total_stock_value: Decimal
    low_stock_products: int
    pending_purchase_orders: int
    total_stock_transactions: int


class LowStockProduct(BaseModel):
    id: int
    name: str
    sku: str
    quantity: int
    min_stock: int
    unit_price: Decimal

    model_config = ConfigDict(from_attributes=True)


class RecentTransaction(BaseModel):
    id: int
    product_id: int
    transaction_type: str
    quantity: int
    user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
