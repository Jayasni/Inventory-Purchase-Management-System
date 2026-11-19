
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.purchase_order import PurchaseOrder
from app.models.purchase_order_item import PurchaseOrderItem
from app.models.product import Product
from app.models.stock_transaction import StockTransaction


def receive_purchase_order(
    purchase: PurchaseOrder,
    db: Session,
    user_id: int
):
    if purchase.status == "received":
        raise HTTPException(
            status_code=409,
            detail="This purchase order has already been received"
        )

    if purchase.status != "ordered":
        raise HTTPException(
            status_code=400,
            detail="Only ordered purchase orders can be received"
        )

    for item in purchase.items:
        product = (
            db.query(Product)
            .filter(Product.id == item.product_id)
            .with_for_update()
            .first()
        )

        if not product or not product.is_active:
            raise HTTPException(
                status_code=400,
                detail=f"Product {item.product_id} is missing or inactive"
            )

        product.quantity += item.quantity

        transaction = StockTransaction(
            product_id=product.id,
            user_id=user_id,
            transaction_type="receipt",
            quantity=item.quantity,
            reference_type="purchase_order",
            reference_id=purchase.id,
            notes=f"Stock received for purchase order #{purchase.id}"
        )

        db.add(transaction)

    purchase.status = "received"
