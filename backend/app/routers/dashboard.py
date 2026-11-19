
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.product import Product
from app.models.supplier import Supplier
from app.models.category import Category
from app.models.purchase_order import PurchaseOrder
from app.models.stock_transaction import StockTransaction
from app.core.dependencies import require_role

from app.schemas.dashboard import (
    DashboardSummary,
    LowStockProduct,
    RecentTransaction
)

router = APIRouter(
    prefix="/api/v1/dashboard",
    tags=["Dashboard"]
)


# 1. Dashboard Summary
@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "staff"))
):
    total_products = db.query(Product).filter(
        Product.is_active == True
    ).count()

    total_suppliers = db.query(Supplier).filter(
        Supplier.is_active == True
    ).count()

    total_categories = db.query(Category).count()

    total_stock = db.query(
        func.coalesce(func.sum(Product.quantity), 0)
    ).filter(
        Product.is_active == True
    ).scalar()

    stock_value = db.query(
        func.coalesce(
            func.sum(Product.quantity * Product.unit_price),
            0
        )
    ).filter(
        Product.is_active == True
    ).scalar()

    low_stock_count = db.query(Product).filter(
        Product.is_active == True,
        Product.quantity <= Product.min_stock
    ).count()

    pending_purchases = db.query(PurchaseOrder).filter(
        PurchaseOrder.status.in_(["draft", "ordered"])
    ).count()

    total_transactions = db.query(
        StockTransaction
    ).count()

    return {
        "total_products": total_products,
        "total_suppliers": total_suppliers,
        "total_categories": total_categories,
        "total_stock_units": total_stock,
        "total_stock_value": stock_value,
        "low_stock_products": low_stock_count,
        "pending_purchase_orders": pending_purchases,
        "total_stock_transactions": total_transactions
    }


# 2. Low Stock Products
@router.get("/low-stock", response_model=list[LowStockProduct])
def dashboard_low_stock(
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "staff"))
):
    products = db.query(Product).filter(
        Product.is_active == True,
        Product.quantity <= Product.min_stock
    ).order_by(Product.quantity.asc()).all()

    return products


# 3. Recent Stock Transactions
@router.get(
    "/recent-transactions",
    response_model=list[RecentTransaction]
)
def recent_transactions(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "staff"))
):
    limit = max(1, min(limit, 100))

    transactions = (
        db.query(StockTransaction)
        .order_by(StockTransaction.id.desc())
        .limit(limit)
        .all()
    )

    return transactions
