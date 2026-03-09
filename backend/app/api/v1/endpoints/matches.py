from fastapi import APIRouter, Depends

from app.db.mongodb import get_db
from app.core.security import get_current_user
from app.services.matching_service import find_mutual_matches

router = APIRouter()


@router.get("")
async def get_matches(current_user=Depends(get_current_user), db=Depends(get_db)):
    matches = await find_mutual_matches(current_user, db)
    return {"matches": matches, "count": len(matches)}
