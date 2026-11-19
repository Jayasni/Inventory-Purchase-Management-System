
from sqlalchemy import (
    Column,
    Integer,
    ForeignKey,
    String,
    Numeric,
    DateTime,
    CheckConstraint,
    func
)
from sqlalchemy.orm import relationship

from app.database import Base


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(Integer, primary_key=True, index=True)

    supplier_id = Column(
        Integer,
        ForeignKey("suppliers.id"),
        nullable=False
    )

    created_by_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    order_date = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    status = Column(
        String(20),
        default="draft",
        nullable=False
    )

    total_amount = Column(
        Numeric(12, 2),
        default=0,
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    __table_args__ = (
        CheckConstraint(
            "status IN ('draft', 'ordered', 'received', 'cancelled')",
            name="check_purchase_status"
        ),
        CheckConstraint(
            "total_amount >= 0",
            name="check_purchase_total"
        ),
    )

    supplier = relationship(
        "Supplier",
        back_populates="purchase_orders"
    )

    created_by = relationship(
        "User",
        back_populates="purchase_orders"
    )

    items = relationship(
        "PurchaseOrderItem",
        back_populates="purchase_order",
        cascade="all, delete-orphan"
    )
