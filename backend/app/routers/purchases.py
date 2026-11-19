
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models.purchase_order import PurchaseOrder
from app.models.purchase_order_item import PurchaseOrderItem
from app.models.product import Product
from app.models.supplier import Supplier
from app.schemas.purchase import (
    PurchaseCreate,
    PurchaseUpdate,
    PurchaseResponse
)
from app.core.dependencies import require_role
from app.services.purchase_service import receive_purchase_order


router = APIRouter(
    prefix="/api/v1/purchases",
    tags=["Purchase Orders"]
)


# 1. Create Purchase Order - Admin only
@router.post(
    "/",
    response_model=PurchaseResponse,
    status_code=status.HTTP_201_CREATED
)
def create_purchase(
    purchase_data: PurchaseCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin"))
):
    supplier = db.query(Supplier).filter(
        Supplier.id == purchase_data.supplier_id,
        Supplier.is_active == True
    ).first()

    if not supplier:
        raise HTTPException(
            status_code=404,
            detail="Active supplier not found"
        )

    total = Decimal("0.00")
    purchase_items = []

    for item in purchase_data.items:
        product = db.query(Product).filter(
            Product.id == item.product_id,
            Product.is_active == True
        ).first()

        if not product:
            raise HTTPException(
                status_code=404,
                detail=f"Active product {item.product_id} not found"
            )

        if product.supplier_id is not None:
            if product.supplier_id != supplier.id:
                raise HTTPException(
                    status_code=400,
                    detail=f"Product {product.id} is assigned to another supplier"
                )

        subtotal = item.quantity * item.unit_price
        total += subtotal

        purchase_items.append(
            PurchaseOrderItem(
                product_id=product.id,
                quantity=item.quantity,
                unit_price=item.unit_price
            )
        )

    purchase = PurchaseOrder(
        supplier_id=supplier.id,
        created_by_id=current_user.id,
        status="draft",
        total_amount=total,
        items=purchase_items
    )

    db.add(purchase)
    db.commit()
    db.refresh(purchase)

    return purchase


# 2. Get All Purchase Orders
@router.get("/", response_model=list[PurchaseResponse])
def get_purchases(
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "staff"))
):
    return (
        db.query(PurchaseOrder)
        .options(selectinload(PurchaseOrder.items))
        .order_by(PurchaseOrder.id.desc())
        .all()
    )


# 3. Get Purchase Order by ID
@router.get("/{purchase_id}", response_model=PurchaseResponse)
def get_purchase(
    purchase_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "staff"))
):
    purchase = (
        db.query(PurchaseOrder)
        .options(selectinload(PurchaseOrder.items))
        .filter(PurchaseOrder.id == purchase_id)
        .first()
    )

    if not purchase:
        raise HTTPException(
            status_code=404,
            detail="Purchase order not found"
        )

    return purchase


# 4. Update Purchase Order Status
@router.put("/{purchase_id}", response_model=PurchaseResponse)
def update_purchase(
    purchase_id: int,
    purchase_data: PurchaseUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin"))
):
    purchase = (
        db.query(PurchaseOrder)
        .options(selectinload(PurchaseOrder.items))
        .filter(PurchaseOrder.id == purchase_id)
        .with_for_update()
        .first()
    )

    if not purchase:
        raise HTTPException(
            status_code=404,
            detail="Purchase order not found"
        )

    new_status = purchase_data.status

    if purchase.status == "received":
        raise HTTPException(
            status_code=400,
            detail="Received purchase orders cannot be changed"
        )

    if purchase.status == "cancelled":
        raise HTTPException(
            status_code=400,
            detail="Cancelled purchase orders cannot be changed"
        )

    if new_status == "draft":
        if purchase.status != "draft":
            raise HTTPException(
                status_code=400,
                detail="Cannot move an order back to draft"
            )

    elif new_status == "ordered":
        if purchase.status != "draft":
            raise HTTPException(
                status_code=400,
                detail="Only draft orders can be marked as ordered"
            )

    elif new_status == "received":
        receive_purchase_order(
            purchase=purchase,
            db=db,
            user_id=current_user.id
        )

    elif new_status == "cancelled":
        if purchase.status not in ("draft", "ordered"):
            raise HTTPException(
                status_code=400,
                detail="This purchase order cannot be cancelled"
            )
        purchase.status = "cancelled"

    db.commit()
    db.refresh(purchase)

    return purchase
