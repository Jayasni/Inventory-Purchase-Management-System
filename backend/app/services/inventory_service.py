
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.models.product import Product
from app.models.stock_transaction import StockTransaction


def create_stock_transaction(
    product_id: int,
    user_id: int,
    transaction_type: str,
    quantity: int,
    reference_type: str | None,
    reference_id: int | None,
    notes: str | None,
    db: Session
):
    product = (
        db.query(Product)
        .filter(
            Product.id == product_id,
            Product.is_active == True
        )
        .with_for_update()
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Active product not found"
        )

    if transaction_type not in ("receipt", "issue", "adjustment"):
        raise HTTPException(status_code=422, detail="Unsupported transaction type")

    if transaction_type in ("receipt", "issue") and quantity <= 0:
        raise HTTPException(status_code=422, detail="Receipt and issue quantities must be greater than zero")

    if transaction_type == "receipt":
        product.quantity += quantity

    elif transaction_type == "issue":
        if product.quantity < quantity:
            raise HTTPException(
                status_code=400,
                detail="Insufficient stock"
            )
        product.quantity -= quantity

    elif transaction_type == "adjustment":
        # Adjustment sets the newly counted stock quantity.
        product.quantity = quantity

    transaction = StockTransaction(
        product_id=product.id,
        user_id=user_id,
        transaction_type=transaction_type,
        quantity=quantity,
        reference_type=reference_type,
        reference_id=reference_id,
        notes=notes
    )

    db.add(transaction)
    try:
        db.commit()
        db.refresh(transaction)
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Stock transaction could not be saved")

    return transaction
