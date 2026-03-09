from typing import List, Optional
from pydantic import BaseModel, Field


class RatingCreate(BaseModel):
    swap_id: str
    ratee_id: str
    score: int = Field(..., ge=1, le=5)
    review: Optional[str] = ""
    tags: Optional[List[str]] = []


class RatingOut(BaseModel):
    id: str
    swap_id: str
    rater_id: str
    ratee_id: str
    score: int
    review: str
    tags: List[str]
