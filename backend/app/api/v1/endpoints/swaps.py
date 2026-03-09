from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from datetime import datetime

from app.db.mongodb import get_db
from app.schemas.swap import SwapCreate, SwapOut
from app.models.swap import swap_document
from app.core.security import get_current_user

router = APIRouter()


def serialize_swap(swap: dict) -> SwapOut:
    return SwapOut(
        id=str(swap["_id"]),
        sender_id=swap["sender_id"],
        receiver_id=swap["receiver_id"],
        offered_skill_id=swap["offered_skill_id"],
        wanted_skill_id=swap["wanted_skill_id"],
        message=swap.get("message", ""),
        session_type=swap.get("session_type", "online"),
        status=swap["status"],
        sender_confirmed=swap.get("sender_confirmed", False),
        receiver_confirmed=swap.get("receiver_confirmed", False),
    )


@router.post("", response_model=SwapOut, status_code=201)
async def create_swap(data: SwapCreate, current_user=Depends(get_current_user), db=Depends(get_db)):
    my_id = str(current_user["_id"])
    if my_id == data.receiver_id:
        raise HTTPException(status_code=400, detail="Cannot swap with yourself")

    # Verify skills exist
    try:
        offered = await db["skills"].find_one({"_id": ObjectId(data.offered_skill_id)})
        wanted  = await db["skills"].find_one({"_id": ObjectId(data.wanted_skill_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid skill ID")

    # Block duplicate active swaps for the same skill pair between the same two users.
    # Check both directions: A→B with (offer, want) and B→A with the mirrored pair.
    duplicate = await db["swaps"].find_one({
        "$or": [
            {
                "sender_id":        my_id,
                "receiver_id":      data.receiver_id,
                "offered_skill_id": data.offered_skill_id,
                "wanted_skill_id":  data.wanted_skill_id,
            },
            {
                "sender_id":        data.receiver_id,
                "receiver_id":      my_id,
                "offered_skill_id": data.wanted_skill_id,
                "wanted_skill_id":  data.offered_skill_id,
            },
        ],
        "status": {"$in": ["pending", "accepted"]},
    })
    if duplicate:
        raise HTTPException(
            status_code=400,
            detail="An active swap with these exact skills already exists between you two. "
                   "Complete or cancel it before creating a new one.",
        )

    if not offered or not wanted:
        raise HTTPException(status_code=404, detail="Skill not found")

    doc = swap_document(
        sender_id=my_id,
        receiver_id=data.receiver_id,
        offered_skill_id=data.offered_skill_id,
        wanted_skill_id=data.wanted_skill_id,
        message=data.message or "",
        session_type=data.session_type,
    )
    result = await db["swaps"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_swap(doc)


@router.get("")
async def list_swaps(current_user=Depends(get_current_user), db=Depends(get_db)):
    my_id = str(current_user["_id"])
    swaps = await db["swaps"].find(
        {"$or": [{"sender_id": my_id}, {"receiver_id": my_id}]}
    ).to_list(None)
    return [serialize_swap(s) for s in swaps]


@router.put("/{swap_id}/accept", response_model=SwapOut)
async def accept_swap(swap_id: str, current_user=Depends(get_current_user), db=Depends(get_db)):
    swap = await _get_swap(swap_id, db)
    my_id = str(current_user["_id"])

    if swap["receiver_id"] != my_id:
        raise HTTPException(status_code=403, detail="Only the receiver can accept")
    if swap["status"] != "pending":
        raise HTTPException(status_code=400, detail="Swap is not pending")

    await db["swaps"].update_one(
        {"_id": ObjectId(swap_id)},
        {"$set": {"status": "accepted", "updated_at": datetime.utcnow()}}
    )
    updated = await db["swaps"].find_one({"_id": ObjectId(swap_id)})
    return serialize_swap(updated)


@router.put("/{swap_id}/reject", response_model=SwapOut)
async def reject_swap(swap_id: str, current_user=Depends(get_current_user), db=Depends(get_db)):
    swap = await _get_swap(swap_id, db)
    my_id = str(current_user["_id"])

    if swap["receiver_id"] != my_id:
        raise HTTPException(status_code=403, detail="Only the receiver can reject")
    if swap["status"] != "pending":
        raise HTTPException(status_code=400, detail="Swap is not pending")

    await db["swaps"].update_one(
        {"_id": ObjectId(swap_id)},
        {"$set": {"status": "rejected", "updated_at": datetime.utcnow()}}
    )
    updated = await db["swaps"].find_one({"_id": ObjectId(swap_id)})
    return serialize_swap(updated)


@router.put("/{swap_id}/confirm", response_model=SwapOut)
async def confirm_swap(swap_id: str, current_user=Depends(get_current_user), db=Depends(get_db)):
    swap = await _get_swap(swap_id, db)
    my_id = str(current_user["_id"])

    if swap["status"] != "accepted":
        raise HTTPException(status_code=400, detail="Swap must be accepted before confirming")
    if my_id not in [swap["sender_id"], swap["receiver_id"]]:
        raise HTTPException(status_code=403, detail="Not part of this swap")

    updates = {"updated_at": datetime.utcnow()}
    if my_id == swap["sender_id"]:
        updates["sender_confirmed"] = True
    else:
        updates["receiver_confirmed"] = True

    # Check if both will be confirmed after this update
    sender_confirmed = swap.get("sender_confirmed", False) or (my_id == swap["sender_id"])
    receiver_confirmed = swap.get("receiver_confirmed", False) or (my_id == swap["receiver_id"])

    if sender_confirmed and receiver_confirmed:
        updates["status"] = "completed"
        # Award credits to both users
        for uid in [swap["sender_id"], swap["receiver_id"]]:
            try:
                await db["users"].update_one(
                    {"_id": ObjectId(uid)},
                    {"$inc": {"credits": 1}}
                )
            except Exception:
                pass

    await db["swaps"].update_one({"_id": ObjectId(swap_id)}, {"$set": updates})
    updated = await db["swaps"].find_one({"_id": ObjectId(swap_id)})
    return serialize_swap(updated)


@router.put("/{swap_id}/cancel", response_model=SwapOut)
async def cancel_swap(swap_id: str, current_user=Depends(get_current_user), db=Depends(get_db)):
    swap = await _get_swap(swap_id, db)
    my_id = str(current_user["_id"])

    if my_id not in [swap["sender_id"], swap["receiver_id"]]:
        raise HTTPException(status_code=403, detail="Not part of this swap")
    if swap["status"] in ["completed", "cancelled"]:
        raise HTTPException(status_code=400, detail="Cannot cancel a completed or already cancelled swap")

    await db["swaps"].update_one(
        {"_id": ObjectId(swap_id)},
        {"$set": {"status": "cancelled", "updated_at": datetime.utcnow()}}
    )
    updated = await db["swaps"].find_one({"_id": ObjectId(swap_id)})
    return serialize_swap(updated)


async def _get_swap(swap_id: str, db) -> dict:
    try:
        oid = ObjectId(swap_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid swap ID")
    swap = await db["swaps"].find_one({"_id": oid})
    if not swap:
        raise HTTPException(status_code=404, detail="Swap not found")
    return swap
