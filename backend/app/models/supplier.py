
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    func
)
from sqlalchemy.orm import relationship

from app.database import Base


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(150), nullable=False)

    email = Column(String(255), nullable=True)

    phone = Column(String(20), nullable=True)

    address = Column(String(255), nullable=True)

    is_active = Column(
        Boolean,
        default=True,
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    products = relationship(
        "Product",
        back_populates="supplier"
    )

    purchase_orders = relationship(
        "PurchaseOrder",
        back_populates="supplier"
    )
