"""
Tests for swap endpoints:
  POST   /api/v1/swaps
  GET    /api/v1/swaps
  PUT    /api/v1/swaps/{id}/accept
  PUT    /api/v1/swaps/{id}/reject
  PUT    /api/v1/swaps/{id}/confirm
  PUT    /api/v1/swaps/{id}/cancel
"""
import pytest
from tests.conftest import (
    make_user, make_skill, auth, get_token,
    USER_EMAIL, USER_PASSWORD, ADMIN_EMAIL, ADMIN_PASSWORD,
)


# ── helpers ───────────────────────────────────────────────────────────────────

async def _setup_two_users_with_skills(db):
    """Create user A and user B each with one offered skill. Return (a, b, skill_a, skill_b)."""
    user_a = await make_user(db, email="usera@test.com", password="passwordA1", display_name="User A")
    user_b = await make_user(db, email="userb@test.com", password="passwordB1", display_name="User B")
    skill_a = await make_skill(db, user_id=str(user_a["_id"]), name="Python", skill_type="offered")
    skill_b = await make_skill(db, user_id=str(user_b["_id"]), name="JavaScript", skill_type="offered")
    return user_a, user_b, skill_a, skill_b


async def _create_swap_via_api(client, token_a, user_b, skill_a, skill_b) -> dict:
    """Login as A and POST /api/v1/swaps. Returns response JSON."""
    resp = await client.post(
        "/api/v1/swaps",
        json={
            "receiver_id": str(user_b["_id"]),
            "offered_skill_id": str(skill_a["_id"]),
            "wanted_skill_id": str(skill_b["_id"]),
            "session_type": "online",
        },
        headers=auth(token_a),
    )
    return resp


# ── tests ─────────────────────────────────────────────────────────────────────

async def test_user_can_create_swap_request(client, db):
    user_a, user_b, skill_a, skill_b = await _setup_two_users_with_skills(db)
    token_a = await get_token(client, "usera@test.com", "passwordA1")

    resp = await _create_swap_via_api(client, token_a, user_b, skill_a, skill_b)

    assert resp.status_code == 201
    body = resp.json()
    assert "id" in body
    assert body["status"] == "pending"
    assert body["sender_id"] == str(user_a["_id"])
    assert body["receiver_id"] == str(user_b["_id"])


async def test_swap_request_requires_valid_participants(client, db):
    """Using a valid-format but non-existent receiver_id and skill IDs returns 404 or 422/400."""
    user_a = await make_user(db, email="usera@test.com", password="passwordA1", display_name="User A")
    token_a = await get_token(client, "usera@test.com", "passwordA1")

    # receiver_id and skill IDs are valid hex strings but don't exist in the DB
    resp = await client.post(
        "/api/v1/swaps",
        json={
            "receiver_id": "000000000000000000000001",
            "offered_skill_id": "000000000000000000000002",
            "wanted_skill_id": "000000000000000000000003",
            "session_type": "online",
        },
        headers=auth(token_a),
    )
    # The endpoint returns 404 when skills are not found
    assert resp.status_code == 404


async def test_user_can_accept_swap_request(client, db):
    user_a, user_b, skill_a, skill_b = await _setup_two_users_with_skills(db)
    token_a = await get_token(client, "usera@test.com", "passwordA1")
    token_b = await get_token(client, "userb@test.com", "passwordB1")

    # A creates swap
    create_resp = await _create_swap_via_api(client, token_a, user_b, skill_a, skill_b)
    assert create_resp.status_code == 201
    swap_id = create_resp.json()["id"]

    # B accepts
    accept_resp = await client.put(
        f"/api/v1/swaps/{swap_id}/accept",
        headers=auth(token_b),
    )
    assert accept_resp.status_code == 200
    assert accept_resp.json()["status"] == "accepted"


async def test_non_participant_cannot_accept_swap_request(client, db):
    user_a, user_b, skill_a, skill_b = await _setup_two_users_with_skills(db)
    user_c = await make_user(db, email="userc@test.com", password="passwordC1", display_name="User C")

    token_a = await get_token(client, "usera@test.com", "passwordA1")
    token_c = await get_token(client, "userc@test.com", "passwordC1")

    # A creates swap to B
    create_resp = await _create_swap_via_api(client, token_a, user_b, skill_a, skill_b)
    assert create_resp.status_code == 201
    swap_id = create_resp.json()["id"]

    # C tries to accept — should be forbidden (only receiver can accept)
    resp = await client.put(
        f"/api/v1/swaps/{swap_id}/accept",
        headers=auth(token_c),
    )
    assert resp.status_code == 403


async def test_swap_cannot_be_completed_without_proper_flow(client, db):
    """
    Confirming a pending swap (before it is accepted) must be rejected with 400.
    The endpoint checks: if swap["status"] != "accepted" → 400.
    """
    user_a, user_b, skill_a, skill_b = await _setup_two_users_with_skills(db)
    token_a = await get_token(client, "usera@test.com", "passwordA1")

    # A creates swap — status is "pending"
    create_resp = await _create_swap_via_api(client, token_a, user_b, skill_a, skill_b)
    assert create_resp.status_code == 201
    swap_id = create_resp.json()["id"]

    # A tries to confirm before swap is accepted
    resp = await client.put(
        f"/api/v1/swaps/{swap_id}/confirm",
        headers=auth(token_a),
    )
    assert resp.status_code == 400
    assert "accepted" in resp.json()["detail"].lower()


async def test_both_sides_confirm_before_rating_allowed(client, db):
    """
    Full flow: A creates swap → B accepts → A confirms (one side only).
    Rating attempt before B confirms must return 400 (swap not completed yet).
    """
    user_a, user_b, skill_a, skill_b = await _setup_two_users_with_skills(db)
    token_a = await get_token(client, "usera@test.com", "passwordA1")
    token_b = await get_token(client, "userb@test.com", "passwordB1")

    # Step 1: A creates swap
    create_resp = await _create_swap_via_api(client, token_a, user_b, skill_a, skill_b)
    assert create_resp.status_code == 201
    swap_id = create_resp.json()["id"]

    # Step 2: B accepts
    accept_resp = await client.put(
        f"/api/v1/swaps/{swap_id}/accept",
        headers=auth(token_b),
    )
    assert accept_resp.status_code == 200

    # Step 3: Only A confirms (B has not confirmed yet → status stays "accepted")
    confirm_resp = await client.put(
        f"/api/v1/swaps/{swap_id}/confirm",
        headers=auth(token_a),
    )
    assert confirm_resp.status_code == 200
    # Status should still be "accepted", not "completed"
    assert confirm_resp.json()["status"] == "accepted"

    # Step 4: A tries to rate B — swap is not completed yet → 400
    rating_resp = await client.post(
        "/api/v1/ratings",
        json={
            "swap_id": swap_id,
            "ratee_id": str(user_b["_id"]),
            "score": 5,
            "review": "Great!",
            "tags": ["helpful"],
        },
        headers=auth(token_a),
    )
    assert rating_resp.status_code == 400
    assert "completed" in rating_resp.json()["detail"].lower()


async def test_user_can_list_their_swaps(client, db):
    user_a, user_b, skill_a, skill_b = await _setup_two_users_with_skills(db)
    token_a = await get_token(client, "usera@test.com", "passwordA1")

    # Create a swap first
    create_resp = await _create_swap_via_api(client, token_a, user_b, skill_a, skill_b)
    assert create_resp.status_code == 201

    # List swaps as A
    list_resp = await client.get("/api/v1/swaps", headers=auth(token_a))
    assert list_resp.status_code == 200
    swaps = list_resp.json()
    assert isinstance(swaps, list)
    assert len(swaps) >= 1
    ids = [s["id"] for s in swaps]
    assert create_resp.json()["id"] in ids
