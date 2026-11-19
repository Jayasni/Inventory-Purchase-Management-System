"""Allow zero quantity for stock-count adjustment history.

Revision ID: 20261119_stock_qty
Revises: 85f0db3d21d5
"""
from alembic import op

revision = "20261119_stock_qty"
down_revision = "85f0db3d21d5"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_constraint("check_transaction_quantity", "stock_transactions", type_="check")
    op.create_check_constraint(
        "check_transaction_quantity",
        "stock_transactions",
        "quantity >= 0",
    )


def downgrade() -> None:
    op.drop_constraint("check_transaction_quantity", "stock_transactions", type_="check")
    op.create_check_constraint(
        "check_transaction_quantity",
        "stock_transactions",
        "quantity > 0",
    )
