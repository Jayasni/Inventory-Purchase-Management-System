
from fastapi import FastAPI, APIRouter, HTTPException, Depends
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.database import engine
from app.models.user import User
from app.routers.auth import router as auth_router
from app.routers.products import router as product_router
from app.routers import suppliers, categories
from app.routers import purchases, inventory, dashboard
from fastapi.middleware.cors import CORSMiddleware

from app.core.dependencies import (
    get_current_user,
    require_role
)


# Create FastAPI application
app = FastAPI(
    title="Inventory Management System",
    description="Inventory and Purchase Management API",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    # Vite may choose 5174 (or another port) when 5173 is busy.
    # Restrict the regex to local development hosts only.
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Protected APIs router
router = APIRouter(
    prefix="/api/v1/test",
    tags=["Protected APIs"]
)


# Register routers
app.include_router(auth_router)
app.include_router(product_router)
app.include_router(router)
app.include_router(suppliers.router)
app.include_router(categories.router)
app.include_router(purchases.router)
app.include_router(inventory.router)
app.include_router(dashboard.router)

# Home API
@app.get("/")
def home():
    return {
        "message": "Welcome to Inventory Management System",
        "status": "running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "success",
        "message": "Inventory Management API is running"
    }

# Protected Profile API
@router.get("/profile")
def profile(
    current_user: User = Depends(get_current_user)
):
    return {
        "message": "You are authenticated",
        "email": current_user.email,
        "role": current_user.role
    }


# Admin Only API
@router.get("/admin")
def admin_only(
    current_user: User = Depends(require_role("admin"))
):
    return {
        "message": "Welcome Admin",
        "email": current_user.email,
        "role": current_user.role
    }


# Staff and Admin API
@router.get("/staff")
def staff_only(
    current_user: User = Depends(
        require_role("staff", "admin")
    )
):
    return {
        "message": "Welcome Staff",
        "email": current_user.email,
        "role": current_user.role
    }


# Database Connection Test API
@app.get("/api/v1/test-db")
def test_database():

    try:
        with engine.connect() as connection:

            database_name = connection.execute(
                text("SELECT current_database()")
            ).scalar_one()

        return {
            "status": "success",
            "database": database_name,
            "message": "PostgreSQL connected successfully"
        }

    except SQLAlchemyError:
        raise HTTPException(
            status_code=503,
            detail="Database connection failed. Check your database configuration."
        )
