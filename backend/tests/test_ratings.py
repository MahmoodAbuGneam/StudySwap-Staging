"""
Tests for rating endpoints:
  POST /api/v1/ratings
  GET  /api/v1/ratings/user/{user_id}
"""
from datetime import datetime

import pytest
from bson import ObjectId

from tests.conftest import (
    make_user, make_skill, auth, get_token,
    USER_EMAIL, USER_PASSWORD, ADMIN_EMAIL, ADMIN_PASSWORD,
)


# ── local helper ──────────────────────────────────────────────────────────────

async def make_completed_swap(db, sender_id, receiver_id, offered_skill_id, wanted_skill_id):
    """Insert a completed swap document directly into the test DB and return it."""
    doc = {
        "sender_id": str(sender_id),
        "receiver_id": str(receiver_id),
        "offered_skill_id": str(offered_skill_id),
        "wanted_skill_id": str(wanted_skill_id),
        "message": "",
        "session_type": "online",
        "status": "completed",
        "sender_confirmed": True,
        "receiver_confirmed": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = await db["swaps"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


async def make_pending_swap(db, sender_id, receiver_id, offered_skill_id, wanted_skill_id):
    """Insert a pending swap document directly into the test DB and return it."""
    doc = {
        "sender_id": str(sender_id),
        "receiver_id": str(receiver_id),
        "offered_skill_id": str(offered_skill_id),
        "wanted_skill_id": str(wanted_skill_id),
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


# ── tests ─────────────────────────────────────────────────────────────────────

async def test_user_can_rate_after_completed_swap(client, db):
    user_a = await make_user(db, email="usera@test.com", password="passwordA1", display_name="User A")
    user_b = await make_user(db, email="userb@test.com", password="passwordB1", display_name="User B")
    skill_a = await make_skill(db, user_id=str(user_a["_id"]), name="Python", skill_type="offered")
    skill_b = await make_skill(db, user_id=str(user_b["_id"]), name="JavaScript", skill_type="offered")

    swap = await make_completed_swap(
        db,
        sender_id=user_a["_id"],
        receiver_id=user_b["_id"],
        offered_skill_id=skill_a["_id"],
        wanted_skill_id=skill_b["_id"],
    )

    token_a = await get_token(client, "usera@test.com", "passwordA1")

    resp = await client.post(
        "/api/v1/ratings",
        json={
            "swap_id": str(swap["_id"]),
            "ratee_id": str(user_b["_id"]),
            "score": 5,
            "review": "Great!",
            "tags": ["helpful"],
        },
        headers=auth(token_a),
    )
    # Endpoint returns 201 on creation
    assert resp.status_code == 201
    body = resp.json()
    assert body["score"] == 5
    assert body["ratee_id"] == str(user_b["_id"])


async def test_user_cannot_rate_before_completed_swap(client, db):
    user_a = await make_user(db, email="usera@test.com", password="passwordA1", display_name="User A")
    user_b = await make_user(db, email="userb@test.com", password="passwordB1", display_name="User B")
    skill_a = await make_skill(db, user_id=str(user_a["_id"]), name="Python", skill_type="offered")
    skill_b = await make_skill(db, user_id=str(user_b["_id"]), name="JavaScript", skill_type="offered")

    swap = await make_pending_swap(
        db,
        sender_id=user_a["_id"],
        receiver_id=user_b["_id"],
        offered_skill_id=skill_a["_id"],
        wanted_skill_id=skill_b["_id"],
    )

    token_a = await get_token(client, "usera@test.com", "passwordA1")

    resp = await client.post(
        "/api/v1/ratings",
        json={
            "swap_id": str(swap["_id"]),
            "ratee_id": str(user_b["_id"]),
            "score": 4,
            "review": "Good",
            "tags": [],
        },
        headers=auth(token_a),
    )
    assert resp.status_code == 400
    assert "completed" in resp.json()["detail"].lower()


async def test_rating_score_must_be_between_1_and_5(client, db):
    """Pydantic validates score ge=1, le=5. Values 0 and 6 should return 422."""
    user_a = await make_user(db, email="usera@test.com", password="passwordA1", display_name="User A")
    token_a = await get_token(client, "usera@test.com", "passwordA1")

    # Fake but valid-format IDs — Pydantic schema validation (score) fires before any DB lookup
    fake_swap_id = "a" * 24
    fake_ratee_id = "b" * 24

    resp_zero = await client.post(
        "/api/v1/ratings",
        json={
            "swap_id": fake_swap_id,
            "ratee_id": fake_ratee_id,
            "score": 0,
            "review": "",
            "tags": [],
        },
        headers=auth(token_a),
    )
    assert resp_zero.status_code == 422

    resp_six = await client.post(
        "/api/v1/ratings",
        json={
            "swap_id": fake_swap_id,
            "ratee_id": fake_ratee_id,
            "score": 6,
            "review": "",
            "tags": [],
        },
        headers=auth(token_a),
    )
    assert resp_six.status_code == 422


async def test_rating_updates_user_aggregate_values(client, db):
    user_a = await make_user(db, email="usera@test.com", password="passwordA1", display_name="User A")
    user_b = await make_user(db, email="userb@test.com", password="passwordB1", display_name="User B")
    skill_a = await make_skill(db, user_id=str(user_a["_id"]), name="Python", skill_type="offered")
    skill_b = await make_skill(db, user_id=str(user_b["_id"]), name="JavaScript", skill_type="offered")

    swap = await make_completed_swap(
        db,
        sender_id=user_a["_id"],
        receiver_id=user_b["_id"],
        offered_skill_id=skill_a["_id"],
        wanted_skill_id=skill_b["_id"],
    )
    token_a = await get_token(client, "usera@test.com", "passwordA1")

    # First rating: score=4
    resp1 = await client.post(
        "/api/v1/ratings",
        json={
            "swap_id": str(swap["_id"]),
            "ratee_id": str(user_b["_id"]),
            "score": 4,
            "review": "Good",
            "tags": [],
        },
        headers=auth(token_a),
    )
    assert resp1.status_code == 201

    stats1 = await client.get(f"/api/v1/ratings/user/{str(user_b['_id'])}")
    assert stats1.status_code == 200
    body1 = stats1.json()
    assert body1["avg_rating"] == 4.0
    assert body1["total"] == 1

    # Upsert with score=2 (same rater + swap + ratee) — should update, not add
    resp2 = await client.post(
        "/api/v1/ratings",
        json={
            "swap_id": str(swap["_id"]),
            "ratee_id": str(user_b["_id"]),
            "score": 2,
            "review": "Updated",
            "tags": [],
        },
        headers=auth(token_a),
    )
    # Upsert path still returns 201 (the endpoint always returns status_code=201)
    assert resp2.status_code == 201

    stats2 = await client.get(f"/api/v1/ratings/user/{str(user_b['_id'])}")
    assert stats2.status_code == 200
    body2 = stats2.json()
    assert body2["avg_rating"] == 2.0
    assert body2["total"] == 1  # upsert — still one record


async def test_admin_can_delete_rating_and_reaggregate(client, db):
    """
    Create two completed swaps: A→B (A rates B with score=5) and C→B (C rates B with score=3).
    B's avg should be 4.0.  Admin deletes the first rating.
    B's avg should become 3.0 and total == 1.
    Also verify via GET /api/v1/users/{B_id}.
    """
    user_a = await make_user(db, email="usera@test.com", password="passwordA1", display_name="User A")
    user_b = await make_user(db, email="userb@test.com", password="passwordB1", display_name="User B")
    user_c = await make_user(db, email="userc@test.com", password="passwordC1", display_name="User C")
    admin  = await make_user(db, email=ADMIN_EMAIL, password=ADMIN_PASSWORD, display_name="Admin", role="admin")

    skill_a = await make_skill(db, user_id=str(user_a["_id"]), name="Python", skill_type="offered")
    skill_b = await make_skill(db, user_id=str(user_b["_id"]), name="JavaScript", skill_type="offered")
    skill_c = await make_skill(db, user_id=str(user_c["_id"]), name="Rust", skill_type="offered")

    swap1 = await make_completed_swap(db, user_a["_id"], user_b["_id"], skill_a["_id"], skill_b["_id"])
    swap2 = await make_completed_swap(db, user_c["_id"], user_b["_id"], skill_c["_id"], skill_b["_id"])

    token_a = await get_token(client, "usera@test.com", "passwordA1")
    token_c = await get_token(client, "userc@test.com", "passwordC1")
    admin_token = await get_token(client, ADMIN_EMAIL, ADMIN_PASSWORD)

    # A rates B with 5
    r1 = await client.post(
        "/api/v1/ratings",
        json={"swap_id": str(swap1["_id"]), "ratee_id": str(user_b["_id"]), "score": 5, "review": "", "tags": []},
        headers=auth(token_a),
    )
    assert r1.status_code == 201
    rating1_id = r1.json()["id"]

    # C rates B with 3
    r2 = await client.post(
        "/api/v1/ratings",
        json={"swap_id": str(swap2["_id"]), "ratee_id": str(user_b["_id"]), "score": 3, "review": "", "tags": []},
        headers=auth(token_c),
    )
    assert r2.status_code == 201

    # Verify initial avg = 4.0, total = 2
    stats_before = await client.get(f"/api/v1/ratings/user/{str(user_b['_id'])}")
    assert stats_before.json()["avg_rating"] == 4.0
    assert stats_before.json()["total"] == 2

    # Admin deletes rating1 (score=5)
    del_resp = await client.delete(
        f"/api/v1/admin/ratings/{rating1_id}",
        headers=auth(admin_token),
    )
    assert del_resp.status_code == 200

    # After deletion: only C's rating (score=3) remains
    stats_after = await client.get(f"/api/v1/ratings/user/{str(user_b['_id'])}")
    body_after = stats_after.json()
    assert body_after["total"] == 1
    # avg_rating on the ratings endpoint is computed live from remaining docs
    assert body_after["avg_rating"] == 3.0

    # Verify user record was updated too via GET /api/v1/users/{id}
    user_resp = await client.get(f"/api/v1/users/{str(user_b['_id'])}")
    assert user_resp.status_code == 200
    user_body = user_resp.json()
    assert user_body["total_ratings"] == 1
