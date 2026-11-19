
from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    Text,
    DateTime,
    CheckConstraint,
    Index,
    func
)
from sqlalchemy.orm import relationship

from app.database import Base


class StockTransaction(Base):
    __tablename__ = "stock_transactions"

    id = Column(Integer, primary_key=True, index=True)

    product_id = Column(
        Integer,
        ForeignKey("products.id"),
        nullable=False
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    transaction_type = Column(
        String(20),
        nullable=False
    )

    quantity = Column(Integer, nullable=False)

    reference_type = Column(String(30), nullable=True)

    reference_id = Column(Integer, nullable=True)

    notes = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    __table_args__ = (
        CheckConstraint(
            "transaction_type IN ('receipt', 'issue', 'adjustment')",
            name="check_transaction_type"
        ),
        CheckConstraint(
            "quantity >= 0",
            name="check_transaction_quantity"
        ),
        Index(
            "ix_stock_transactions_product_date",
            "product_id",
            "created_at"
        ),
    )

    product = relationship(
        "Product",
        back_populates="stock_transactions"
    )

    user = relationship(
        "User",
        back_populates="stock_transactions"
    )
