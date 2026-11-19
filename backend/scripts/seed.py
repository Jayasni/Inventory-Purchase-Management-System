"""Insert a local demo admin, categories, supplier, products and opening stock.

Run after `alembic upgrade head` with backend/.env configured.
"""
import os
from decimal import Decimal

from app.database import SessionLocal
from app.models import Category, Product, Supplier, User, StockTransaction
from app.core.security import hash_password


def main():
    db = SessionLocal()
    try:
        admin_email = os.getenv("SEED_ADMIN_EMAIL", "admin@example.com")
        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            admin = User(
                full_name=os.getenv("SEED_ADMIN_NAME", "Inventory Admin"),
                email=admin_email,
                hashed_password=hash_password(os.getenv("SEED_ADMIN_PASSWORD", "ChangeMe123!")),
                role="admin",
                is_active=True,
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)

        category_names = ["Office Supplies", "Electronics", "Packaging"]
        categories = {}
        for name in category_names:
            row = db.query(Category).filter(Category.name == name).first()
            if not row:
                row = Category(name=name, description=f"{name} inventory")
                db.add(row)
                db.flush()
            categories[name] = row

        supplier = db.query(Supplier).filter(Supplier.name == "Sample Supplier Co.").first()
        if not supplier:
            supplier = Supplier(
                name="Sample Supplier Co.",
                email="sales@example.test",
                phone="9000000000",
                address="Demo address",
                is_active=True,
            )
            db.add(supplier)
            db.flush()

        samples = [
            ("A4 Paper Ream", "OFF-001", "Office Supplies", 25, 5, Decimal("285.00")),
            ("Wireless Mouse", "ELE-001", "Electronics", 8, 10, Decimal("650.00")),
            ("Shipping Box", "PKG-001", "Packaging", 60, 15, Decimal("22.50")),
        ]
        for name, sku, category_name, opening_qty, min_stock, price in samples:
            product = db.query(Product).filter(Product.sku == sku).first()
            if not product:
                product = Product(
                    name=name, sku=sku, category_id=categories[category_name].id,
                    supplier_id=supplier.id, quantity=opening_qty,
                    min_stock=min_stock, unit_price=price, is_active=True,
                )
                db.add(product)
                db.flush()
                db.add(StockTransaction(
                    product_id=product.id, user_id=admin.id,
                    transaction_type="receipt", quantity=opening_qty,
                    reference_type="opening_balance", notes="Demo opening stock",
                ))
        db.commit()
        print(f"Demo data ready. Admin: {admin_email}")
        print("Set SEED_ADMIN_PASSWORD in backend/.env before running this script.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
