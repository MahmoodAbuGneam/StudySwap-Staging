from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from datetime import datetime

from app.db.mongodb import get_db
from app.schemas.user import UserOut, UserUpdate
from app.core.security import get_current_user

router = APIRouter()


def serialize_user(user: dict) -> UserOut:
    return UserOut(
        id=str(user["_id"]),
        email=user["email"],
        display_name=user["display_name"],
        bio=user.get("bio", ""),
        academic_field=user.get("academic_field", ""),
        avatar_url=user.get("avatar_url", ""),
        availability=user.get("availability", []),
        session_types=user.get("session_types", []),
        credits=user.get("credits", 0),
        avg_rating=user.get("avg_rating", 0.0),
        total_ratings=user.get("total_ratings", 0),
    )


@router.get("/{user_id}", response_model=UserOut)
async def get_user(user_id: str, db=Depends(get_db)):
    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    user = await db["users"].find_one({"_id": oid})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return serialize_user(user)


@router.put("/me", response_model=UserOut)
async def update_me(data: UserUpdate, current_user=Depends(get_current_user), db=Depends(get_db)):
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    updates["updated_at"] = datetime.utcnow()

    await db["users"].update_one(
        {"_id": current_user["_id"]},
        {"$set": updates}
    )
    updated = await db["users"].find_one({"_id": current_user["_id"]})
    return serialize_user(updated)
