import re
from typing import Optional, Literal
from pydantic import BaseModel, Field, field_validator, ConfigDict

OBJECT_ID_RE = re.compile(r'^[a-f0-9]{24}$')


class SwapCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    receiver_id: str
    offered_skill_id: str
    wanted_skill_id: str
    message: Optional[str] = Field("", max_length=500)
    session_type: Literal["online", "in-person", "hybrid"] = "online"

    @field_validator("receiver_id", "offered_skill_id", "wanted_skill_id")
    @classmethod
    def validate_object_id(cls, v: str) -> str:
        if not OBJECT_ID_RE.match(v):
            raise ValueError("Must be a valid 24-character hex ID")
        return v


class SwapOut(BaseModel):
    id: str
    sender_id: str
    receiver_id: str
    offered_skill_id: str
    wanted_skill_id: str
    message: str
    session_type: str
    status: str
    sender_confirmed: bool
    receiver_confirmed: bool
