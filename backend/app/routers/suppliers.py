
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.models.supplier import Supplier
from app.schemas.supplier import (
    SupplierCreate,
    SupplierUpdate,
    SupplierResponse
)
from app.core.dependencies import require_role

router = APIRouter(
    prefix="/api/v1/suppliers",
    tags=["Suppliers"]
)


# 1. Create Supplier - Admin only
@router.post(
    "/",
    response_model=SupplierResponse,
    status_code=status.HTTP_201_CREATED
)
def create_supplier(
    supplier_data: SupplierCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin"))
):
    existing_supplier = db.query(Supplier).filter(
        Supplier.name.ilike(supplier_data.name.strip())
    ).first()

    if existing_supplier:
        raise HTTPException(
            status_code=409,
            detail="Supplier with this name already exists"
        )

    new_supplier = Supplier(
        name=supplier_data.name.strip(),
        email=supplier_data.email,
        phone=supplier_data.phone,
        address=supplier_data.address,
        is_active=True
    )

    try:
        db.add(new_supplier)
        db.commit()
        db.refresh(new_supplier)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Supplier could not be created"
        )

    return new_supplier


# 2. Get All Suppliers - Admin and Staff
@router.get("/", response_model=list[SupplierResponse])
def get_suppliers(
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "staff"))
):
    return db.query(Supplier).filter(
        Supplier.is_active == True
    ).order_by(Supplier.id.desc()).all()


# 3. Search Suppliers - Admin and Staff
@router.get("/search", response_model=list[SupplierResponse])
def search_suppliers(
    keyword: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "staff"))
):
    return db.query(Supplier).filter(
        Supplier.is_active == True,
        or_(
            Supplier.name.ilike(f"%{keyword}%"),
            Supplier.email.ilike(f"%{keyword}%"),
            Supplier.phone.ilike(f"%{keyword}%")
        )
    ).all()


# 4. Get Supplier by ID - Admin and Staff
@router.get("/{supplier_id}", response_model=SupplierResponse)
def get_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "staff"))
):
    supplier = db.query(Supplier).filter(
        Supplier.id == supplier_id,
        Supplier.is_active == True
    ).first()

    if not supplier:
        raise HTTPException(
            status_code=404,
            detail="Supplier not found"
        )

    return supplier


# 5. Update Supplier - Admin only
@router.put("/{supplier_id}", response_model=SupplierResponse)
def update_supplier(
    supplier_id: int,
    supplier_data: SupplierUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin"))
):
    supplier = db.query(Supplier).filter(
        Supplier.id == supplier_id,
        Supplier.is_active == True
    ).first()

    if not supplier:
        raise HTTPException(
            status_code=404,
            detail="Supplier not found"
        )

    update_data = supplier_data.model_dump(exclude_unset=True)

    if "name" in update_data:
        update_data["name"] = update_data["name"].strip()

        duplicate = db.query(Supplier).filter(
            Supplier.name.ilike(update_data["name"]),
            Supplier.id != supplier_id
        ).first()

        if duplicate:
            raise HTTPException(
                status_code=409,
                detail="Another supplier already uses this name"
            )

    for field, value in update_data.items():
        setattr(supplier, field, value)

    db.commit()
    db.refresh(supplier)

    return supplier


# 6. Deactivate Supplier - Admin only
@router.delete("/{supplier_id}")
def deactivate_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin"))
):
    supplier = db.query(Supplier).filter(
        Supplier.id == supplier_id,
        Supplier.is_active == True
    ).first()

    if not supplier:
        raise HTTPException(
            status_code=404,
            detail="Supplier not found"
        )

    supplier.is_active = False

    db.commit()

    return {
        "message": "Supplier deactivated successfully"
    }
