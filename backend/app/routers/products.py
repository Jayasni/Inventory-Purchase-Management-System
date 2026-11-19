from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.dependencies import require_role
from app.database import get_db
from app.models.category import Category
from app.models.product import Product
from app.models.supplier import Supplier
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse

router = APIRouter(prefix="/api/v1/products", tags=["Products"])


def validate_relations(db: Session, category_id: int, supplier_id: int | None):
    if not db.query(Category).filter(Category.id == category_id).first():
        raise HTTPException(status_code=404, detail="Category not found")
    if supplier_id is not None:
        supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
        if not supplier or not supplier.is_active:
            raise HTTPException(status_code=404, detail="Active supplier not found")


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product_data: ProductCreate, db: Session = Depends(get_db), current_user=Depends(require_role("admin"))):
    sku = product_data.sku.strip().upper()
    if db.query(Product).filter(func.lower(Product.sku) == sku.lower()).first():
        raise HTTPException(status_code=409, detail="Product with this SKU already exists")
    validate_relations(db, product_data.category_id, product_data.supplier_id)
    product = Product(
        name=product_data.name.strip(), sku=sku,
        description=product_data.description,
        category_id=product_data.category_id,
        supplier_id=product_data.supplier_id,
        quantity=0, min_stock=product_data.min_stock,
        unit_price=product_data.unit_price, is_active=True,
    )
    try:
        db.add(product)
        db.commit()
        db.refresh(product)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Product could not be created; check SKU and related records")
    return product


@router.get("/search", response_model=list[ProductResponse])
def search_products(keyword: str = Query(min_length=1), db: Session = Depends(get_db), current_user=Depends(require_role("admin", "staff"))):
    term = f"%{keyword.strip()}%"
    return db.query(Product).filter(Product.is_active.is_(True), or_(Product.name.ilike(term), Product.sku.ilike(term))).order_by(Product.name).all()


@router.get("/low-stock", response_model=list[ProductResponse])
def get_low_stock_products(db: Session = Depends(get_db), current_user=Depends(require_role("admin", "staff"))):
    return db.query(Product).filter(Product.is_active.is_(True), Product.quantity <= Product.min_stock).order_by(Product.quantity.asc()).all()


@router.get("/category/{category_id}", response_model=list[ProductResponse])
def get_products_by_category(category_id: int, db: Session = Depends(get_db), current_user=Depends(require_role("admin", "staff"))):
    return db.query(Product).filter(Product.category_id == category_id, Product.is_active.is_(True)).order_by(Product.name).all()


@router.get("/", response_model=list[ProductResponse])
def get_products(keyword: str | None = None, category_id: int | None = None, low_stock: bool = False, db: Session = Depends(get_db), current_user=Depends(require_role("admin", "staff"))):
    query = db.query(Product).filter(Product.is_active.is_(True))
    if keyword:
        term = f"%{keyword.strip()}%"
        query = query.filter(or_(Product.name.ilike(term), Product.sku.ilike(term)))
    if category_id:
        query = query.filter(Product.category_id == category_id)
    if low_stock:
        query = query.filter(Product.quantity <= Product.min_stock)
    return query.order_by(Product.name).all()


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db), current_user=Depends(require_role("admin", "staff"))):
    product = db.query(Product).filter(Product.id == product_id, Product.is_active.is_(True)).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, product_data: ProductUpdate, db: Session = Depends(get_db), current_user=Depends(require_role("admin"))):
    product = db.query(Product).filter(Product.id == product_id, Product.is_active.is_(True)).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    changes = product_data.model_dump(exclude_unset=True)
    if "name" in changes and changes["name"] is not None:
        changes["name"] = changes["name"].strip()
    if "category_id" in changes or "supplier_id" in changes:
        validate_relations(db, changes.get("category_id", product.category_id), changes.get("supplier_id", product.supplier_id))
    for key, value in changes.items():
        setattr(product, key, value)
    try:
        db.commit()
        db.refresh(product)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Product update conflicts with existing data")
    return product


@router.delete("/{product_id}")
def deactivate_product(product_id: int, db: Session = Depends(get_db), current_user=Depends(require_role("admin"))):
    product = db.query(Product).filter(Product.id == product_id, Product.is_active.is_(True)).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.is_active = False
    db.commit()
    return {"message": "Product deactivated successfully"}
