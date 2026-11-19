
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    ForeignKey,
    Numeric,
    DateTime,
    CheckConstraint,
    func
)
from sqlalchemy.orm import relationship

from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String(150),
        nullable=False
    )

    sku = Column(
        String(50),
        unique=True,
        index=True,
        nullable=False
    )

    description = Column(
        Text,
        nullable=True
    )

    category_id = Column(
        Integer,
        ForeignKey("categories.id"),
        nullable=False
    )

    supplier_id = Column(
        Integer,
        ForeignKey("suppliers.id"),
        nullable=True
    )

    quantity = Column(
        Integer,
        default=0,
        nullable=False
    )

    min_stock = Column(
        Integer,
        default=5,
        nullable=False
    )

    unit_price = Column(
        Numeric(12, 2),
        default=0,
        nullable=False
    )

    is_active = Column(
        Boolean,
        default=True,
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    __table_args__ = (
        CheckConstraint(
            "quantity >= 0",
            name="check_product_quantity"
        ),
        CheckConstraint(
            "min_stock >= 0",
            name="check_product_min_stock"
        ),
        CheckConstraint(
            "unit_price >= 0",
            name="check_product_price"
        ),
    )

    category = relationship(
        "Category",
        back_populates="products"
    )

    supplier = relationship(
        "Supplier",
        back_populates="products"
    )

    purchase_items = relationship(
        "PurchaseOrderItem",
        back_populates="product"
    )

    stock_transactions = relationship(
        "StockTransaction",
        back_populates="product"
    )
