from datetime import datetime
from typing import List, Optional


def rating_document(
    swap_id: str,
    rater_id: str,
    ratee_id: str,
    score: int,
    review: str = "",
    tags: List[str] = None,
) -> dict:
    return {
        "swap_id": swap_id,
        "rater_id": rater_id,
        "ratee_id": ratee_id,
        "score": score,
        "review": review,
        "tags": tags or [],
        "created_at": datetime.utcnow(),
    }
