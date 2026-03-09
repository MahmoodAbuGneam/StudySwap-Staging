from datetime import datetime


def swap_document(
    sender_id: str,
    receiver_id: str,
    offered_skill_id: str,
    wanted_skill_id: str,
    message: str = "",
    session_type: str = "online",
) -> dict:
    return {
        "sender_id": sender_id,
        "receiver_id": receiver_id,
        "offered_skill_id": offered_skill_id,
        "wanted_skill_id": wanted_skill_id,
        "message": message,
        "session_type": session_type,
        "status": "pending",
        "sender_confirmed": False,
        "receiver_confirmed": False,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
