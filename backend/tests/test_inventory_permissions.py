import pytest
from fastapi import HTTPException

from app.routers.inventory import validate_transaction_permission


def test_staff_can_issue_stock():
    validate_transaction_permission("staff", "issue")


@pytest.mark.parametrize("transaction_type", ["receipt", "adjustment"])
def test_staff_cannot_receive_or_adjust_stock(transaction_type):
    with pytest.raises(HTTPException) as exc:
        validate_transaction_permission("staff", transaction_type)
    assert exc.value.status_code == 403


@pytest.mark.parametrize("transaction_type", ["receipt", "issue", "adjustment"])
def test_admin_can_record_all_transaction_types(transaction_type):
    validate_transaction_permission("admin", transaction_type)
