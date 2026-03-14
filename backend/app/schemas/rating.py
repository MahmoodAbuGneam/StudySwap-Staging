import re
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator, ConfigDict

OBJECT_ID_RE = re.compile(r'^[a-f0-9]{24}$')


class RatingCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    swap_id: str
    ratee_id: str
    score: int = Field(..., ge=1, le=5)
    review: Optional[str] = Field("", max_length=1000)
    tags: Optional[List[str]] = []

    @field_validator("swap_id", "ratee_id")
    @classmethod
    def validate_object_id(cls, v: str) -> str:
        if not OBJECT_ID_RE.match(v):
            raise ValueError("Must be a valid 24-character hex ID")
        return v

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        if v is not None:
            if len(v) > 5:
                raise ValueError("Maximum 5 tags allowed")
            for tag in v:
                if len(tag) > 30:
                    raise ValueError("Each tag must be 30 characters or less")
        return v


class RatingOut(BaseModel):
    id: str
    swap_id: str
    rater_id: str
    ratee_id: str
    score: int
    review: str
    tags: List[str]
