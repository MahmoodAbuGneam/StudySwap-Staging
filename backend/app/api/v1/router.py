from fastapi import APIRouter

from app.api.v1.endpoints import auth, users, skills, browse, matches, swaps, favorites, ratings

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(skills.router, prefix="/skills", tags=["skills"])
api_router.include_router(browse.router, prefix="/browse", tags=["browse"])
api_router.include_router(matches.router, prefix="/matches", tags=["matches"])
api_router.include_router(swaps.router, prefix="/swaps", tags=["swaps"])
api_router.include_router(favorites.router, prefix="/favorites", tags=["favorites"])
api_router.include_router(ratings.router, prefix="/ratings", tags=["ratings"])
