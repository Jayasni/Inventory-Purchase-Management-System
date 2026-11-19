
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# User Registration
class UserCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)


# User Login
class UserLogin(BaseModel):
    email: EmailStr
    password: str


# User Update
class UserUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=100)
    email: EmailStr | None = None
    is_active: bool | None = None


# User Response
class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# JWT Token Response
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# JWT Token Data
class TokenData(BaseModel):
    email: EmailStr | None = None
