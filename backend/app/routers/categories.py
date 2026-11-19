from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.models.category import Category
from app.schemas.category import (
    CategoryCreate,
    CategoryUpdate,
    CategoryResponse
)
from app.core.dependencies import require_role


router = APIRouter(
    prefix="/api/v1/categories",
    tags=["Categories"]
)


# CREATE CATEGORY - Admin only
@router.post(
    "/",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED
)
def create_category(
    category_data: CategoryCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin"))
):
    name = category_data.name.strip()

    if len(name) < 2:
        raise HTTPException(
            status_code=422,
            detail="Category name must contain at least 2 characters"
        )

    existing = db.query(Category).filter(
        func.lower(Category.name) == name.lower()
    ).first()

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Category already exists"
        )

    category = Category(
        name=name,
        description=category_data.description
    )

    try:
        db.add(category)
        db.commit()
        db.refresh(category)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Could not create category"
        )

    return category


# GET ALL CATEGORIES - Admin and Staff
@router.get(
    "/",
    response_model=list[CategoryResponse]
)
def get_categories(
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "staff"))
):
    return (
        db.query(Category)
        .order_by(Category.id.desc())
        .all()
    )


# GET CATEGORY BY ID
@router.get(
    "/{category_id}",
    response_model=CategoryResponse
)
def get_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "staff"))
):
    category = db.query(Category).filter(
        Category.id == category_id
    ).first()

    if not category:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    return category


# UPDATE CATEGORY - Admin only
@router.put(
    "/{category_id}",
    response_model=CategoryResponse
)
def update_category(
    category_id: int,
    category_data: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin"))
):
    category = db.query(Category).filter(
        Category.id == category_id
    ).first()

    if not category:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    update_data = category_data.model_dump(
        exclude_unset=True
    )

    if "name" in update_data:
        name = update_data["name"].strip()

        if len(name) < 2:
            raise HTTPException(
                status_code=422,
                detail="Category name must contain at least 2 characters"
            )

        duplicate = db.query(Category).filter(
            func.lower(Category.name) == name.lower(),
            Category.id != category_id
        ).first()

        if duplicate:
            raise HTTPException(
                status_code=409,
                detail="Another category already uses this name"
            )

        update_data["name"] = name

    for field, value in update_data.items():
        setattr(category, field, value)

    try:
        db.commit()
        db.refresh(category)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Could not update category"
        )

    return category


# DELETE CATEGORY
@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin"))
):
    category = db.query(Category).filter(
        Category.id == category_id
    ).first()

    if not category:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    if category.products:
        raise HTTPException(
            status_code=409,
            detail="Cannot delete category because products are associated with it"
        )

    db.delete(category)
    db.commit()

    return {
        "message": "Category deleted successfully"
    }