from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    display_name: str = Field(..., min_length=1)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    bio: Optional[str] = None
    academic_field: Optional[str] = None
    avatar_url: Optional[str] = None
    availability: Optional[List[dict]] = None
    session_types: Optional[List[str]] = None


class UserOut(BaseModel):
    id: str
    email: str
    display_name: str
    bio: str
    academic_field: str
    avatar_url: str
    availability: List[dict]
    session_types: List[str]
    credits: int
    avg_rating: float
    total_ratings: int


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
