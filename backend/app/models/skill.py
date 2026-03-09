from datetime import datetime
from typing import Optional


def skill_document(
    user_id: str,
    name: str,
    category: str,
    level: str,
    skill_type: str,
    description: str = "",
    deadline: Optional[str] = None,
) -> dict:
    return {
        "user_id": user_id,
        "name": name,
        "category": category,
        "level": level,
        "type": skill_type,
        "description": description,
        "deadline": deadline,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
