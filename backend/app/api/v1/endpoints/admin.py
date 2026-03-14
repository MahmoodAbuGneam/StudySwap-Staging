from fastapi import APIRouter, HTTPException, Depends, Query
from bson import ObjectId
from typing import Optional
from app.db.mongodb import get_db
from app.core.security import get_admin_user

router = APIRouter()

DEFAULT_CATEGORIES = [
    "Programming",
    "Mathematics",
    "Engineering",
    "Languages",
    "Design",
    "Academic Writing",
    "Study Skills",
    "Data Science",
]

VALID_STATUSES = {"active", "suspended", "disabled"}


def admin_serialize_user(u: dict) -> dict:
    return {
        "id": str(u["_id"]),
        "email": u.get("email", ""),
        "display_name": u.get("display_name", ""),
        "role": u.get("role", "user"),
        "status": u.get("status", "active"),
        "credits": u.get("credits", 0),
        "avg_rating": u.get("avg_rating", 0.0),
        "total_ratings": u.get("total_ratings", 0),
        "created_at": u["created_at"].isoformat() if u.get("created_at") else None,
    }


# ── Users ──────────────────────────────────────────────────────────────────────

@router.get("/users")
async def list_users(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db=Depends(get_db),
    _admin=Depends(get_admin_user),
):
    query: dict = {}
    if status:
        query["status"] = status
    if search:
        query["$or"] = [
            {"display_name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
        ]
    cursor = db["users"].find(query)
    users = await cursor.to_list(length=None)
    return [admin_serialize_user(u) for u in users]


@router.patch("/users/{user_id}/status")
async def update_user_status(
    user_id: str,
    body: dict,
    db=Depends(get_db),
    _admin=Depends(get_admin_user),
):
    new_status = body.get("status")
    if new_status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {sorted(VALID_STATUSES)}",
        )
    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    result = await db["users"].find_one_and_update(
        {"_id": oid},
        {"$set": {"status": new_status}},
        return_document=True,
    )
    if result is None:
        raise HTTPException(status_code=404, detail="User not found")
    return admin_serialize_user(result)


PROTECTED_ADMIN_EMAIL = "administrator@gmail.com"


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    db=Depends(get_db),
    _admin=Depends(get_admin_user),
):
    # Prevent any admin from deleting their own account
    if user_id == str(_admin["_id"]):
        raise HTTPException(status_code=403, detail="You cannot delete your own account")

    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    user = await db["users"].find_one({"_id": oid})
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent deletion of the protected main admin account
    if user.get("email") == PROTECTED_ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="The main administrator account cannot be deleted")

    await db["users"].delete_one({"_id": oid})
    await db["skills"].delete_many({"user_id": str(oid)})
    await db["swaps"].delete_many(
        {"$or": [{"sender_id": str(oid)}, {"receiver_id": str(oid)}]}
    )
    await db["favorites"].delete_many(
        {"$or": [{"user_id": str(oid)}, {"favorite_id": str(oid)}]}
    )
    await db["ratings"].delete_many(
        {"$or": [{"rater_id": str(oid)}, {"ratee_id": str(oid)}]}
    )

    return {"message": "User deleted"}


# ── Categories ─────────────────────────────────────────────────────────────────

async def _get_or_seed_categories(db) -> list:
    count = await db["categories"].count_documents({})
    if count == 0:
        docs = [{"name": c} for c in DEFAULT_CATEGORIES]
        await db["categories"].insert_many(docs)
    cursor = db["categories"].find({}, {"_id": 0, "name": 1})
    docs = await cursor.to_list(length=None)
    return [d["name"] for d in docs]


@router.get("/categories")
async def list_categories(
    db=Depends(get_db),
    _admin=Depends(get_admin_user),
):
    categories = await _get_or_seed_categories(db)
    return {"categories": categories}


@router.post("/categories")
async def add_category(
    body: dict,
    db=Depends(get_db),
    _admin=Depends(get_admin_user),
):
    name = body.get("name", "").strip()
    if len(name) < 2:
        raise HTTPException(status_code=400, detail="Category name must be at least 2 characters")
    if len(name) > 50:
        raise HTTPException(status_code=400, detail="Category name must be at most 50 characters")

    existing = await db["categories"].find_one({"name": {"$regex": f"^{name}$", "$options": "i"}})
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")

    await db["categories"].insert_one({"name": name})
    categories = await _get_or_seed_categories(db)
    return {"categories": categories}


@router.delete("/categories/{name}")
async def delete_category(
    name: str,
    db=Depends(get_db),
    _admin=Depends(get_admin_user),
):
    result = await db["categories"].delete_one({"name": name})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    cursor = db["categories"].find({}, {"_id": 0, "name": 1})
    docs = await cursor.to_list(length=None)
    return {"categories": [d["name"] for d in docs]}


# ── Swaps ──────────────────────────────────────────────────────────────────────

@router.get("/swaps")
async def list_swaps(
    status: Optional[str] = Query(None),
    db=Depends(get_db),
    _admin=Depends(get_admin_user),
):
    query: dict = {}
    if status:
        query["status"] = status
    cursor = db["swaps"].find(query)
    swaps = await cursor.to_list(length=None)
    for swap in swaps:
        swap["id"] = str(swap.pop("_id"))
    return swaps


# ── Ratings ────────────────────────────────────────────────────────────────────

@router.get("/ratings")
async def list_ratings(
    db=Depends(get_db),
    _admin=Depends(get_admin_user),
):
    cursor = db["ratings"].find({})
    ratings = await cursor.to_list(length=None)
    for r in ratings:
        r["id"] = str(r.pop("_id"))
    return ratings


@router.delete("/ratings/{rating_id}")
async def delete_rating(
    rating_id: str,
    db=Depends(get_db),
    _admin=Depends(get_admin_user),
):
    try:
        oid = ObjectId(rating_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid rating ID")

    rating = await db["ratings"].find_one({"_id": oid})
    if rating is None:
        raise HTTPException(status_code=404, detail="Rating not found")

    ratee_id = rating.get("ratee_id")
    await db["ratings"].delete_one({"_id": oid})

    # Re-aggregate the ratee's avg_rating and total_ratings
    if ratee_id:
        pipeline = [
            {"$match": {"ratee_id": ratee_id}},
            {
                "$group": {
                    "_id": None,
                    "avg_rating": {"$avg": "$score"},
                    "total_ratings": {"$sum": 1},
                }
            },
        ]
        results = await db["ratings"].aggregate(pipeline).to_list(length=1)
        if results:
            avg = round(results[0]["avg_rating"], 2)
            total = results[0]["total_ratings"]
        else:
            avg = 0.0
            total = 0

        try:
            ratee_oid = ObjectId(ratee_id)
            await db["users"].update_one(
                {"_id": ratee_oid},
                {"$set": {"avg_rating": avg, "total_ratings": total}},
            )
        except Exception:
            pass  # ratee_id might already be a non-ObjectId string in older docs

    return {"message": "Rating deleted"}
