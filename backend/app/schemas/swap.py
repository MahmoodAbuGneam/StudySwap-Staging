from typing import Optional, Literal
from pydantic import BaseModel


class SwapCreate(BaseModel):
    receiver_id: str
    offered_skill_id: str
    wanted_skill_id: str
    message: Optional[str] = ""
    session_type: Literal["online", "in-person", "hybrid"] = "online"


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
