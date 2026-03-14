from app.models.user import user_document
from app.core.security import hash_password

ADMIN_EMAIL    = "administrator@gmail.com"
ADMIN_PASSWORD = "Admin@StudySwap1"


async def seed_admin(db) -> None:
    """
    Ensures the default admin account exists.
    Creates it on first run; skips silently if already present.
    """
    existing = await db["users"].find_one({"email": ADMIN_EMAIL})
    if existing:
        # Make sure the role is admin even if the account was created before roles existed
        if existing.get("role") != "admin":
            await db["users"].update_one(
                {"email": ADMIN_EMAIL},
                {"$set": {"role": "admin"}}
            )
        return

    doc = user_document(
        email=ADMIN_EMAIL,
        hashed_password=hash_password(ADMIN_PASSWORD),
        display_name="Administrator",
    )
    doc["role"] = "admin"
    await db["users"].insert_one(doc)
    print(f"[seed] Default admin created → {ADMIN_EMAIL}")
