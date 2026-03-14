from typing import List, Optional
from datetime import datetime


def user_document(
    email: str,
    hashed_password: str,
    display_name: str,
    bio: str = "",
    academic_field: str = "",
    avatar_url: str = "",
    availability: list = None,
    session_types: list = None,
) -> dict:
    return {
        "email": email,
        "hashed_password": hashed_password,
        "display_name": display_name,
        "bio": bio,
        "academic_field": academic_field,
        "avatar_url": avatar_url,
        "availability": availability or [],
        "session_types": session_types or [],
        "credits": 0,
        "avg_rating": 0.0,
        "total_ratings": 0,
        "favorites": [],
        "role": "user",
        "status": "active",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
