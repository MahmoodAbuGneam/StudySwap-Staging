from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordRequestForm

from app.db.mongodb import get_db
from app.schemas.user import UserRegister, TokenOut, UserOut
from app.models.user import user_document
from app.core.security import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter()


def serialize_user(user: dict) -> UserOut:
    return UserOut(
        id=str(user["_id"]),
        email=user["email"],
        display_name=user["display_name"],
        bio=user.get("bio", ""),
        academic_field=user.get("academic_field", ""),
        avatar_url=user.get("avatar_url", ""),
        availability=user.get("availability", []),
        session_types=user.get("session_types", []),
        credits=user.get("credits", 0),
        avg_rating=user.get("avg_rating", 0.0),
        total_ratings=user.get("total_ratings", 0),
        role=user.get("role", "user"),
        status=user.get("status", "active"),
    )


@router.post("/register", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
async def register(data: UserRegister, db=Depends(get_db)):
    existing = await db["users"].find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    doc = user_document(
        email=data.email,
        hashed_password=hash_password(data.password),
        display_name=data.display_name,
    )
    result = await db["users"].insert_one(doc)
    doc["_id"] = result.inserted_id

    token = create_access_token({"sub": str(result.inserted_id)})
    return TokenOut(access_token=token, user=serialize_user(doc))


@router.post("/login", response_model=TokenOut)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db=Depends(get_db)):
    user = await db["users"].find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": str(user["_id"])})
    return TokenOut(access_token=token, user=serialize_user(user))


@router.get("/me", response_model=UserOut)
async def me(current_user=Depends(get_current_user)):
    return serialize_user(current_user)
