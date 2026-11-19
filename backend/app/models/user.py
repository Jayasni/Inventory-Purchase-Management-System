
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


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    full_name = Column(String, nullable=False)

    email = Column(
        String,
        unique=True,
        index=True,
        nullable=False
    )

    hashed_password = Column(String, nullable=False)

    role = Column(
        String,
        default="staff",
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

    # Purchase orders created by this user
    purchase_orders = relationship(
        "PurchaseOrder",
        back_populates="created_by"
    )
    stock_transactions = relationship(
    "StockTransaction",
    back_populates="user"
)
