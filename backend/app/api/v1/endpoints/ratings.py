from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId

from app.db.mongodb import get_db
from app.schemas.rating import RatingCreate, RatingOut
from app.models.rating import rating_document
from app.core.security import get_current_user

router = APIRouter()


def serialize_rating(r: dict) -> RatingOut:
    return RatingOut(
        id=str(r["_id"]),
        swap_id=r["swap_id"],
        rater_id=r["rater_id"],
        ratee_id=r["ratee_id"],
        score=r["score"],
        review=r.get("review", ""),
        tags=r.get("tags", []),
    )


@router.post("", response_model=RatingOut, status_code=201)
async def submit_rating(data: RatingCreate, current_user=Depends(get_current_user), db=Depends(get_db)):
    my_id = str(current_user["_id"])

    # Verify swap exists and is completed
    try:
        swap = await db["swaps"].find_one({"_id": ObjectId(data.swap_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid swap ID")

    if not swap:
        raise HTTPException(status_code=404, detail="Swap not found")
    if swap["status"] != "completed":
        raise HTTPException(status_code=400, detail="Can only rate after swap is completed")
    if my_id not in [swap["sender_id"], swap["receiver_id"]]:
        raise HTTPException(status_code=403, detail="Not part of this swap")
    if data.ratee_id == my_id:
        raise HTTPException(status_code=400, detail="Cannot rate yourself")
    if data.ratee_id not in [swap["sender_id"], swap["receiver_id"]]:
        raise HTTPException(status_code=400, detail="Ratee must be part of this swap")

    # Upsert: update existing rating or create a new one
    existing = await db["ratings"].find_one({
        "swap_id": data.swap_id,
        "rater_id": my_id,
        "ratee_id": data.ratee_id,
    })

    if existing:
        await db["ratings"].update_one(
            {"_id": existing["_id"]},
            {"$set": {
                "score": data.score,
                "review": data.review or "",
                "tags": data.tags or [],
            }}
        )
        doc = await db["ratings"].find_one({"_id": existing["_id"]})
    else:
        doc = rating_document(
            swap_id=data.swap_id,
            rater_id=my_id,
            ratee_id=data.ratee_id,
            score=data.score,
            review=data.review or "",
            tags=data.tags or [],
        )
        result = await db["ratings"].insert_one(doc)
        doc["_id"] = result.inserted_id

    # Re-aggregate ratee's rating stats
    all_ratings = await db["ratings"].find({"ratee_id": data.ratee_id}).to_list(None)
    total = len(all_ratings)
    avg = sum(r["score"] for r in all_ratings) / total if total > 0 else 0

    try:
        await db["users"].update_one(
            {"_id": ObjectId(data.ratee_id)},
            {"$set": {"avg_rating": round(avg, 2), "total_ratings": total}}
        )
    except Exception:
        pass

    return serialize_rating(doc)


@router.get("/user/{user_id}")
async def get_user_ratings(user_id: str, db=Depends(get_db)):
    ratings = await db["ratings"].find({"ratee_id": user_id}).to_list(None)
    return {
        "ratings": [serialize_rating(r) for r in ratings],
        "avg_rating": round(sum(r["score"] for r in ratings) / len(ratings), 2) if ratings else 0.0,
        "total": len(ratings),
    }
