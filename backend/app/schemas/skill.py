from typing import Optional, Literal
from pydantic import BaseModel, Field, field_validator, ConfigDict


CATEGORIES = [
    "Programming",
    "Mathematics",
    "Engineering",
    "Languages",
    "Design",
    "Academic Writing",
    "Study Skills",
    "Data Science",
]

LEVELS = ["beginner", "intermediate", "advanced"]


class SkillCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(..., min_length=2, max_length=80)
    category: str = Field(..., min_length=2, max_length=50)
    level: Literal["beginner", "intermediate", "advanced"]
    description: Optional[str] = Field("", max_length=300)
    deadline: Optional[str] = None

    @field_validator("name", "category")
    @classmethod
    def strip_fields(cls, v: str) -> str:
        return v.strip()


class SkillUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: Optional[str] = Field(None, min_length=2, max_length=80)
    category: Optional[str] = Field(None, min_length=2, max_length=50)
    level: Optional[Literal["beginner", "intermediate", "advanced"]] = None
    description: Optional[str] = Field(None, max_length=300)
    deadline: Optional[str] = None

    @field_validator("name", "category")
    @classmethod
    def strip_fields(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return v.strip()
        return v


class SkillOut(BaseModel):
    id: str
    user_id: str
    name: str
    category: str
    level: str
    type: str
    description: str
    deadline: Optional[str]
