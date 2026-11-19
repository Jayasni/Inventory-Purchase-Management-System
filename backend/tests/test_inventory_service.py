import os
os.environ.setdefault("SECRET_KEY", "test-only-secret-key-change-me")

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base
from app.models import Category, Product, User, StockTransaction
from app.services.inventory_service import create_stock_transaction


@pytest.fixture()
def db_session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    session = Session()
    category = Category(name="Test category")
    user = User(
        full_name="Test Admin",
        email="admin@test.local",
        hashed_password="not-used-in-this-test",
        role="admin",
        is_active=True,
    )
    session.add_all([category, user])
    session.flush()
    product = Product(
        name="Test item", sku="TEST-001", category_id=category.id,
        quantity=10, min_stock=2, unit_price=5, is_active=True,
    )
    session.add(product)
    session.commit()
    yield session, user, product
    session.close()
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


def transact(session, user, product, kind, qty):
    return create_stock_transaction(
        product_id=product.id, user_id=user.id,
        transaction_type=kind, quantity=qty,
        reference_type=None, reference_id=None, notes=None, db=session,
    )


def test_receipt_and_issue_update_stock_and_history(db_session):
    session, user, product = db_session
    transact(session, user, product, "receipt", 5)
    session.refresh(product)
    assert product.quantity == 15
    transact(session, user, product, "issue", 4)
    session.refresh(product)
    assert product.quantity == 11
    assert session.query(StockTransaction).count() == 2


def test_issue_cannot_make_stock_negative(db_session):
    session, user, product = db_session
    with pytest.raises(HTTPException) as exc:
        transact(session, user, product, "issue", 11)
    assert exc.value.status_code == 400
    session.refresh(product)
    assert product.quantity == 10


def test_adjustment_can_set_stock_to_zero(db_session):
    session, user, product = db_session
    transact(session, user, product, "adjustment", 0)
    session.refresh(product)
    assert product.quantity == 0
