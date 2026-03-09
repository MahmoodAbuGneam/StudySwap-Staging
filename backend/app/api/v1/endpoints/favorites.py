from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId

from app.db.mongodb import get_db
from app.core.security import get_current_user

router = APIRouter()


@router.post("/{user_id}", status_code=200)
async def add_favorite(user_id: str, current_user=Depends(get_current_user), db=Depends(get_db)):
    my_id = str(current_user["_id"])
    if my_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot favorite yourself")

    try:
        target_oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    target = await db["users"].find_one({"_id": target_oid})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    await db["users"].update_one(
        {"_id": current_user["_id"]},
        {"$addToSet": {"favorites": user_id}}
    )
    return {"message": "Added to favorites"}


@router.delete("/{user_id}", status_code=200)
async def remove_favorite(user_id: str, current_user=Depends(get_current_user), db=Depends(get_db)):
    await db["users"].update_one(
        {"_id": current_user["_id"]},
        {"$pull": {"favorites": user_id}}
    )
    return {"message": "Removed from favorites"}


@router.get("")
async def list_favorites(current_user=Depends(get_current_user), db=Depends(get_db)):
    fav_ids = current_user.get("favorites", [])
    if not fav_ids:
        return {"favorites": []}

    profiles = []
    for uid in fav_ids:
        try:
            user = await db["users"].find_one({"_id": ObjectId(uid)})
            if user:
                profiles.append({
                    "id": str(user["_id"]),
                    "display_name": user["display_name"],
                    "bio": user.get("bio", ""),
                    "academic_field": user.get("academic_field", ""),
                    "avatar_url": user.get("avatar_url", ""),
                    "avg_rating": user.get("avg_rating", 0.0),
                    "total_ratings": user.get("total_ratings", 0),
                    "credits": user.get("credits", 0),
                    "session_types": user.get("session_types", []),
                })
        except Exception:
            pass

    return {"favorites": profiles}
