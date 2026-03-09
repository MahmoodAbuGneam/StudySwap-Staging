from typing import Optional, Literal
from pydantic import BaseModel


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
    name: str
    category: str
    level: Literal["beginner", "intermediate", "advanced"]
    description: Optional[str] = ""
    deadline: Optional[str] = None


class SkillUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    level: Optional[Literal["beginner", "intermediate", "advanced"]] = None
    description: Optional[str] = None
    deadline: Optional[str] = None


class SkillOut(BaseModel):
    id: str
    user_id: str
    name: str
    category: str
    level: str
    type: str
    description: str
    deadline: Optional[str]
