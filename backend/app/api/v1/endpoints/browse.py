from fastapi import APIRouter, Depends, Query
from typing import Optional, List

from app.db.mongodb import get_db
from app.schemas.user import get_badge

router = APIRouter()


def serialize_user(user: dict) -> dict:
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "display_name": user["display_name"],
        "bio": user.get("bio", ""),
        "academic_field": user.get("academic_field", ""),
        "avatar_url": user.get("avatar_url", ""),
        "availability": user.get("availability", []),
        "session_types": user.get("session_types", []),
        "credits": user.get("credits", 0),
        "avg_rating": user.get("avg_rating", 0.0),
        "total_ratings": user.get("total_ratings", 0),
        "badge": get_badge(user.get("credits", 0)),
    }


@router.get("/users")
async def browse_users(
    category: Optional[str] = None,
    skill: Optional[str] = None,
    level: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db=Depends(get_db),
):
    skill_filter = {"type": "offered"}
    if category:
        skill_filter["category"] = category
    if skill:
        skill_filter["name"] = {"$regex": skill, "$options": "i"}
    if level:
        skill_filter["level"] = level

    matching_skills = await db["skills"].find(skill_filter, {"user_id": 1}).to_list(None)
    user_ids_with_skills = list({s["user_id"] for s in matching_skills})

    query = {"role": {"$ne": "admin"}}
    if category or skill or level:
        query["_id"] = {"$in": []}
        from bson import ObjectId
        try:
            query["_id"]["$in"] = [ObjectId(uid) for uid in user_ids_with_skills]
        except Exception:
            pass

    skip = (page - 1) * limit
    users = await db["users"].find(query).sort([("avg_rating", -1), ("credits", -1)]).skip(skip).limit(limit).to_list(None)
    total = await db["users"].count_documents(query)

    return {
        "users": [serialize_user(u) for u in users],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit,
    }


@router.get("/skills")
async def browse_skills(
    category: Optional[str] = None,
    skill_type: Optional[str] = None,
    level: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db=Depends(get_db),
):
    query = {}
    if category:
        query["category"] = category
    if skill_type:
        query["type"] = skill_type
    if level:
        query["level"] = level

    skip = (page - 1) * limit
    skills = await db["skills"].find(query).skip(skip).limit(limit).to_list(None)
    total = await db["skills"].count_documents(query)

    return {
        "skills": [
            {
                "id": str(s["_id"]),
                "user_id": s["user_id"],
                "name": s["name"],
                "category": s["category"],
                "level": s["level"],
                "type": s["type"],
                "description": s.get("description", ""),
                "deadline": s.get("deadline"),
            }
            for s in skills
        ],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit,
    }
