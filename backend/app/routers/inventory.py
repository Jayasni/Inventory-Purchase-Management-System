
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.product import Product
from app.models.stock_transaction import StockTransaction
from app.schemas.transaction import (
    TransactionCreate,
    TransactionResponse
)
from app.core.dependencies import require_role
from app.services.inventory_service import create_stock_transaction


def validate_transaction_permission(role: str, transaction_type: str):
    """Staff may issue stock only; Admin may receipt, issue, or adjust."""
    if role == "staff" and transaction_type != "issue":
        raise HTTPException(
            status_code=403,
            detail="Staff can record stock issues only. Receipt and adjustment require Admin access."
        )


router = APIRouter(
    prefix="/api/v1/inventory",
    tags=["Inventory"]
)


# 1. Stock IN / OUT / Adjustment
@router.post(
    "/transactions",
    response_model=TransactionResponse,
    status_code=201
)
def create_transaction(
    transaction_data: TransactionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "staff"))
):
    validate_transaction_permission(current_user.role, transaction_data.transaction_type)

    return create_stock_transaction(
        product_id=transaction_data.product_id,
        user_id=current_user.id,
        transaction_type=transaction_data.transaction_type,
        quantity=transaction_data.quantity,
        reference_type=transaction_data.reference_type,
        reference_id=transaction_data.reference_id,
        notes=transaction_data.notes,
        db=db
    )


# 2. Get All Stock Transactions
@router.get("/transactions", response_model=list[TransactionResponse])
def get_transactions(
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "staff"))
):
    return (
        db.query(StockTransaction)
        .order_by(StockTransaction.id.desc())
        .all()
    )


# 3. Get Transactions for One Product
@router.get(
    "/transactions/product/{product_id}",
    response_model=list[TransactionResponse]
)
def get_product_transactions(
    product_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "staff"))
):
    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return (
        db.query(StockTransaction)
        .filter(StockTransaction.product_id == product_id)
        .order_by(StockTransaction.id.desc())
        .all()
    )


# 4. Get Current Stock for One Product
@router.get("/stock/{product_id}")
def get_product_stock(
    product_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "staff"))
):
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.is_active == True
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Active product not found"
        )

    return {
        "product_id": product.id,
        "product_name": product.name,
        "sku": product.sku,
        "quantity": product.quantity,
        "min_stock": product.min_stock,
        "low_stock": product.quantity <= product.min_stock
    }
