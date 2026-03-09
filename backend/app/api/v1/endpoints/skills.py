from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from datetime import datetime
from typing import List

from app.db.mongodb import get_db
from app.schemas.skill import SkillCreate, SkillUpdate, SkillOut, CATEGORIES
from app.models.skill import skill_document
from app.core.security import get_current_user

router = APIRouter()


def serialize_skill(skill: dict) -> SkillOut:
    return SkillOut(
        id=str(skill["_id"]),
        user_id=skill["user_id"],
        name=skill["name"],
        category=skill["category"],
        level=skill["level"],
        type=skill["type"],
        description=skill.get("description", ""),
        deadline=skill.get("deadline"),
    )


@router.get("/categories", response_model=List[str])
async def get_categories():
    return CATEGORIES


@router.post("/offered", response_model=SkillOut, status_code=201)
async def add_offered_skill(data: SkillCreate, current_user=Depends(get_current_user), db=Depends(get_db)):
    doc = skill_document(
        user_id=str(current_user["_id"]),
        name=data.name,
        category=data.category,
        level=data.level,
        skill_type="offered",
        description=data.description or "",
        deadline=data.deadline,
    )
    result = await db["skills"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_skill(doc)


@router.post("/wanted", response_model=SkillOut, status_code=201)
async def add_wanted_skill(data: SkillCreate, current_user=Depends(get_current_user), db=Depends(get_db)):
    doc = skill_document(
        user_id=str(current_user["_id"]),
        name=data.name,
        category=data.category,
        level=data.level,
        skill_type="wanted",
        description=data.description or "",
        deadline=data.deadline,
    )
    result = await db["skills"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_skill(doc)


@router.get("/mine", response_model=List[SkillOut])
async def get_my_skills(current_user=Depends(get_current_user), db=Depends(get_db)):
    skills = await db["skills"].find({"user_id": str(current_user["_id"])}).to_list(None)
    return [serialize_skill(s) for s in skills]


@router.get("/user/{user_id}", response_model=List[SkillOut])
async def get_user_skills(user_id: str, db=Depends(get_db)):
    skills = await db["skills"].find({"user_id": user_id}).to_list(None)
    return [serialize_skill(s) for s in skills]


@router.put("/{skill_id}", response_model=SkillOut)
async def update_skill(skill_id: str, data: SkillUpdate, current_user=Depends(get_current_user), db=Depends(get_db)):
    try:
        oid = ObjectId(skill_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid skill ID")

    skill = await db["skills"].find_one({"_id": oid})
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    if skill["user_id"] != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not your skill")

    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    updates["updated_at"] = datetime.utcnow()
    await db["skills"].update_one({"_id": oid}, {"$set": updates})
    updated = await db["skills"].find_one({"_id": oid})
    return serialize_skill(updated)


@router.delete("/{skill_id}", status_code=204)
async def delete_skill(skill_id: str, current_user=Depends(get_current_user), db=Depends(get_db)):
    try:
        oid = ObjectId(skill_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid skill ID")

    skill = await db["skills"].find_one({"_id": oid})
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    if skill["user_id"] != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not your skill")

    await db["skills"].delete_one({"_id": oid})
