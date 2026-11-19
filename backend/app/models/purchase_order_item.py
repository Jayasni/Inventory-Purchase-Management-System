
from sqlalchemy import (
    Column,
    Integer,
    ForeignKey,
    Numeric,
    CheckConstraint
)
from sqlalchemy.orm import relationship

from app.database import Base


class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"

    id = Column(Integer, primary_key=True, index=True)

    purchase_order_id = Column(
        Integer,
        ForeignKey("purchase_orders.id", ondelete="CASCADE"),
        nullable=False
    )

    product_id = Column(
        Integer,
        ForeignKey("products.id"),
        nullable=False
    )

    quantity = Column(Integer, nullable=False)

    unit_price = Column(Numeric(12, 2), nullable=False)

    __table_args__ = (
        CheckConstraint(
            "quantity > 0",
            name="check_purchase_item_quantity"
        ),
        CheckConstraint(
            "unit_price >= 0",
            name="check_purchase_item_price"
        ),
    )

    purchase_order = relationship(
        "PurchaseOrder",
        back_populates="items"
    )

    product = relationship(
        "Product",
        back_populates="purchase_items"
    )
