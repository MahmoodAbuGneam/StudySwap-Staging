import re
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict

VALID_SESSION_TYPES = {"online", "in_person", "both"}
VALID_DAYS = {"monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"}


class UserRegister(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    email: EmailStr = Field(..., max_length=255)
    password: str = Field(..., min_length=8, max_length=72)
    display_name: str = Field(..., min_length=2, max_length=60)

    @field_validator("email")
    @classmethod
    def lowercase_email(cls, v: str) -> str:
        return v.lower()

    @field_validator("display_name")
    @classmethod
    def validate_display_name(cls, v: str) -> str:
        if len(v.strip()) < 2:
            raise ValueError("Display name must be at least 2 characters")
        return v.strip()


class UserLogin(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    email: EmailStr = Field(..., max_length=255)
    password: str

    @field_validator("email")
    @classmethod
    def lowercase_email(cls, v: str) -> str:
        return v.lower()


class UserUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    display_name: Optional[str] = Field(None, min_length=2, max_length=60)
    bio: Optional[str] = Field(None, max_length=500)
    academic_field: Optional[str] = Field(None, max_length=100)
    avatar_url: Optional[str] = Field(None, max_length=500)
    availability: Optional[List[dict]] = None
    session_types: Optional[List[str]] = None

    @field_validator("avatar_url")
    @classmethod
    def validate_avatar_url(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v != "" and not re.match(r'^https?://', v):
            raise ValueError("Avatar URL must start with http:// or https://")
        return v

    @field_validator("session_types")
    @classmethod
    def validate_session_types(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        if v is not None:
            invalid = [s for s in v if s not in VALID_SESSION_TYPES]
            if invalid:
                raise ValueError(f"Invalid session type(s): {invalid}. Must be one of: {VALID_SESSION_TYPES}")
        return v


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
    role: str
    status: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
