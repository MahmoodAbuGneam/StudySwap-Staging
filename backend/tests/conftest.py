"""
Shared test fixtures and helpers for StudySwap backend tests.
Each test gets a fully isolated database — all collections are dropped after each test.
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from motor.motor_asyncio import AsyncIOMotorClient

from app.main import app
from app.db.mongodb import get_db
from app.core.security import hash_password
from app.models.user import user_document
from app.models.skill import skill_document

# ── Constants ────────────────────────────────────────────────────────────────

TEST_MONGO_URI = "mongodb://localhost:27017"
TEST_DB_NAME   = "studyswap_test"

USER_EMAIL    = "user@test.com"
USER_PASSWORD = "testpassword123"
ADMIN_EMAIL   = "admin@test.com"
ADMIN_PASSWORD = "adminpassword123"

# ── Core fixtures ─────────────────────────────────────────────────────────────

@pytest_asyncio.fixture
async def db():
    """Isolated test database — dropped after every test."""
    motor_client = AsyncIOMotorClient(TEST_MONGO_URI)
    database = motor_client[TEST_DB_NAME]
    yield database
    for col in await database.list_collection_names():
        await database[col].drop()
    motor_client.close()


@pytest_asyncio.fixture
async def client(db):
    """AsyncClient wired to the test database via dependency override."""
    async def override_get_db():
        return db

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    app.dependency_overrides.clear()


# ── User helpers ──────────────────────────────────────────────────────────────

async def make_user(
    db,
    email: str = USER_EMAIL,
    password: str = USER_PASSWORD,
    display_name: str = "Test User",
    role: str = "user",
    session_types: list = None,
    availability: list = None,
) -> dict:
    """Insert a user document directly into the test DB and return it."""
    doc = user_document(
        email=email,
        hashed_password=hash_password(password),
        display_name=display_name,
        session_types=session_types or ["online"],
        availability=availability or [{"day": "monday"}, {"day": "tuesday"}],
    )
    doc["role"] = role
    result = await db["users"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


async def make_skill(
    db,
    user_id: str,
    name: str,
    category: str = "Programming",
    level: str = "intermediate",
    skill_type: str = "offered",
    description: str = "",
) -> dict:
    """Insert a skill document directly into the test DB and return it."""
    doc = skill_document(
        user_id=user_id,
        name=name,
        category=category,
        level=level,
        skill_type=skill_type,
        description=description,
    )
    result = await db["skills"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


async def get_token(client: AsyncClient, email: str, password: str) -> str:
    """Login and return the access token."""
    resp = await client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password},
    )
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    return resp.json()["access_token"]


def auth(token: str) -> dict:
    """Return Authorization header dict for a token."""
    return {"Authorization": f"Bearer {token}"}


# ── Common fixtures ───────────────────────────────────────────────────────────

@pytest_asyncio.fixture
async def regular_user(db):
    return await make_user(db)


@pytest_asyncio.fixture
async def admin_user(db):
    return await make_user(
        db, email=ADMIN_EMAIL, password=ADMIN_PASSWORD,
        display_name="Admin User", role="admin"
    )


@pytest_asyncio.fixture
async def user_token(client, regular_user):
    return await get_token(client, USER_EMAIL, USER_PASSWORD)


@pytest_asyncio.fixture
async def admin_token(client, admin_user):
    return await get_token(client, ADMIN_EMAIL, ADMIN_PASSWORD)
