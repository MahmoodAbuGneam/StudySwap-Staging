"""
Tests for admin endpoints (all require admin_token):
  GET    /api/v1/admin/users
  PATCH  /api/v1/admin/users/{id}/status
  DELETE /api/v1/admin/users/{id}
  GET    /api/v1/admin/swaps
  GET    /api/v1/admin/ratings
  DELETE /api/v1/admin/ratings/{id}
"""
from datetime import datetime

import pytest
from bson import ObjectId

from tests.conftest import (
    make_user, make_skill, auth, get_token,
    USER_EMAIL, USER_PASSWORD, ADMIN_EMAIL, ADMIN_PASSWORD,
)


# ── local helpers ─────────────────────────────────────────────────────────────

async def _insert_swap(db, sender_id, receiver_id):
    """Insert a minimal swap document and return it."""
    doc = {
        "sender_id": str(sender_id),
        "receiver_id": str(receiver_id),
        "offered_skill_id": "0" * 24,
        "wanted_skill_id": "0" * 24,
        "message": "",
        "session_type": "online",
        "status": "pending",
        "sender_confirmed": False,
        "receiver_confirmed": False,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = await db["swaps"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


async def _insert_rating(db, rater_id, ratee_id, swap_id, score=5):
    """Insert a minimal rating document and return it."""
    doc = {
        "swap_id": str(swap_id),
        "rater_id": str(rater_id),
        "ratee_id": str(ratee_id),
        "score": score,
        "review": "Test review",
        "tags": [],
        "created_at": datetime.utcnow(),
    }
    result = await db["ratings"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


# ── tests ─────────────────────────────────────────────────────────────────────

async def test_admin_can_list_users(client, db):
    admin = await make_user(db, email=ADMIN_EMAIL, password=ADMIN_PASSWORD, display_name="Admin", role="admin")
    await make_user(db, email="user1@test.com", password="password1A", display_name="User One")
    await make_user(db, email="user2@test.com", password="password2A", display_name="User Two")

    admin_token = await get_token(client, ADMIN_EMAIL, ADMIN_PASSWORD)

    resp = await client.get("/api/v1/admin/users", headers=auth(admin_token))
    assert resp.status_code == 200
    users = resp.json()
    assert isinstance(users, list)
    # admin + 2 regular = at least 3
    assert len(users) >= 3


async def test_admin_can_change_user_status(client, db):
    admin = await make_user(db, email=ADMIN_EMAIL, password=ADMIN_PASSWORD, display_name="Admin", role="admin")
    regular = await make_user(db, email="user1@test.com", password="password1A", display_name="Regular")
    admin_token = await get_token(client, ADMIN_EMAIL, ADMIN_PASSWORD)

    user_id = str(regular["_id"])

    patch_resp = await client.patch(
        f"/api/v1/admin/users/{user_id}/status",
        json={"status": "suspended"},
        headers=auth(admin_token),
    )
    assert patch_resp.status_code == 200

    # User should now appear in ?status=suspended filter
    list_resp = await client.get(
        "/api/v1/admin/users?status=suspended",
        headers=auth(admin_token),
    )
    assert list_resp.status_code == 200
    ids = [u["id"] for u in list_resp.json()]
    assert user_id in ids


async def test_user_status_change_affects_access_if_applicable(client, db):
    """
    Verify the status field is actually persisted in the DB after admin disables a user.
    (Login blocking for suspended/disabled users may not be implemented; test only what is.)
    """
    admin = await make_user(db, email=ADMIN_EMAIL, password=ADMIN_PASSWORD, display_name="Admin", role="admin")
    regular = await make_user(db, email="user1@test.com", password="password1A", display_name="Regular")
    admin_token = await get_token(client, ADMIN_EMAIL, ADMIN_PASSWORD)

    user_id = str(regular["_id"])

    patch_resp = await client.patch(
        f"/api/v1/admin/users/{user_id}/status",
        json={"status": "disabled"},
        headers=auth(admin_token),
    )
    assert patch_resp.status_code == 200

    # Confirm the status is persisted by fetching the full user list and finding our user
    list_resp = await client.get("/api/v1/admin/users", headers=auth(admin_token))
    assert list_resp.status_code == 200
    users = list_resp.json()
    target = next((u for u in users if u["id"] == user_id), None)
    assert target is not None
    assert target["status"] == "disabled"


async def test_admin_can_delete_user(client, db):
    admin = await make_user(db, email=ADMIN_EMAIL, password=ADMIN_PASSWORD, display_name="Admin", role="admin")
    regular = await make_user(db, email="user1@test.com", password="password1A", display_name="Regular")
    admin_token = await get_token(client, ADMIN_EMAIL, ADMIN_PASSWORD)

    user_id = str(regular["_id"])

    del_resp = await client.delete(
        f"/api/v1/admin/users/{user_id}",
        headers=auth(admin_token),
    )
    assert del_resp.status_code == 200

    # User should no longer appear in the list
    list_resp = await client.get("/api/v1/admin/users", headers=auth(admin_token))
    assert list_resp.status_code == 200
    ids = [u["id"] for u in list_resp.json()]
    assert user_id not in ids


async def test_admin_delete_user_cleans_related_data(client, db):
    """
    After admin deletes a user, their skills should be removed from the skills collection.
    """
    admin = await make_user(db, email=ADMIN_EMAIL, password=ADMIN_PASSWORD, display_name="Admin", role="admin")
    user_a = await make_user(db, email="usera@test.com", password="passwordA1", display_name="User A")
    admin_token = await get_token(client, ADMIN_EMAIL, ADMIN_PASSWORD)

    # Insert a skill directly for user_a
    skill = await make_skill(db, user_id=str(user_a["_id"]), name="Python", skill_type="offered")
    skill_id = str(skill["_id"])

    user_id = str(user_a["_id"])

    del_resp = await client.delete(
        f"/api/v1/admin/users/{user_id}",
        headers=auth(admin_token),
    )
    assert del_resp.status_code == 200

    # Verify skills are gone from the DB
    remaining_skills = await db["skills"].find({"user_id": user_id}).to_list(None)
    assert len(remaining_skills) == 0


async def test_admin_can_view_swaps(client, db):
    admin = await make_user(db, email=ADMIN_EMAIL, password=ADMIN_PASSWORD, display_name="Admin", role="admin")
    user_a = await make_user(db, email="usera@test.com", password="passwordA1", display_name="User A")
    user_b = await make_user(db, email="userb@test.com", password="passwordB1", display_name="User B")
    admin_token = await get_token(client, ADMIN_EMAIL, ADMIN_PASSWORD)

    # Insert a swap directly
    await _insert_swap(db, sender_id=user_a["_id"], receiver_id=user_b["_id"])

    resp = await client.get("/api/v1/admin/swaps", headers=auth(admin_token))
    assert resp.status_code == 200
    swaps = resp.json()
    assert isinstance(swaps, list)
    assert len(swaps) >= 1


async def test_admin_can_view_ratings(client, db):
    admin = await make_user(db, email=ADMIN_EMAIL, password=ADMIN_PASSWORD, display_name="Admin", role="admin")
    user_a = await make_user(db, email="usera@test.com", password="passwordA1", display_name="User A")
    user_b = await make_user(db, email="userb@test.com", password="passwordB1", display_name="User B")
    admin_token = await get_token(client, ADMIN_EMAIL, ADMIN_PASSWORD)

    fake_swap_id = ObjectId()
    await _insert_rating(db, rater_id=user_a["_id"], ratee_id=user_b["_id"], swap_id=fake_swap_id, score=4)

    resp = await client.get("/api/v1/admin/ratings", headers=auth(admin_token))
    assert resp.status_code == 200
    ratings = resp.json()
    assert isinstance(ratings, list)
    assert len(ratings) >= 1
