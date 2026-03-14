"""
Tests for Pydantic schema validation rules:
  - Email normalisation
  - Password length limits
  - display_name length limits
  - ObjectId format validation
  - Rating review length limit
  - Rating tag count and tag length limits
"""
import pytest
from tests.conftest import make_user, auth, get_token, USER_EMAIL, USER_PASSWORD, ADMIN_EMAIL, ADMIN_PASSWORD

# A valid 24-char hex ObjectId placeholder used where the value doesn't matter
_FAKE_OID = "aabbccddeeff001122334455"


# ── Email normalisation ────────────────────────────────────────────────────────

async def test_email_is_normalized_if_expected(client):
    # Register with an uppercase email
    resp = await client.post(
        "/api/v1/auth/register",
        json={"email": "USER@TEST.COM", "password": "securepassword1", "display_name": "Case User"},
    )
    assert resp.status_code == 201

    # Login with the lowercase version must succeed
    resp = await client.post(
        "/api/v1/auth/login",
        data={"username": "user@test.com", "password": "securepassword1"},
    )
    assert resp.status_code == 200
    assert "access_token" in resp.json()


# ── Password length limits ─────────────────────────────────────────────────────

async def test_password_length_limits_are_enforced(client):
    # 7-char password is too short (min is 8)
    resp = await client.post(
        "/api/v1/auth/register",
        json={"email": "short@test.com", "password": "1234567", "display_name": "Valid Name"},
    )
    assert resp.status_code == 422

    # 73-char password exceeds bcrypt limit of 72
    resp = await client.post(
        "/api/v1/auth/register",
        json={"email": "long@test.com", "password": "a" * 73, "display_name": "Valid Name"},
    )
    assert resp.status_code == 422


# ── display_name validation ────────────────────────────────────────────────────

async def test_display_name_validation_is_enforced(client):
    # Single character — too short
    resp = await client.post(
        "/api/v1/auth/register",
        json={"email": "short@test.com", "password": "securepassword1", "display_name": "A"},
    )
    assert resp.status_code == 422

    # Empty string
    resp = await client.post(
        "/api/v1/auth/register",
        json={"email": "empty@test.com", "password": "securepassword1", "display_name": ""},
    )
    assert resp.status_code == 422


# ── ObjectId format validation ─────────────────────────────────────────────────

async def test_object_id_validation_rejects_bad_ids(client, user_token):
    resp = await client.post(
        "/api/v1/swaps",
        json={
            "receiver_id": "notanobjectid",
            "offered_skill_id": _FAKE_OID,
            "wanted_skill_id": _FAKE_OID,
        },
        headers=auth(user_token),
    )
    assert resp.status_code == 422


# ── Rating review length limit ─────────────────────────────────────────────────

async def test_review_length_limits_are_enforced(client, user_token):
    # Pydantic validates max_length=1000 before touching the DB
    resp = await client.post(
        "/api/v1/ratings",
        json={
            "swap_id": _FAKE_OID,
            "ratee_id": _FAKE_OID,
            "score": 5,
            "review": "x" * 1001,
        },
        headers=auth(user_token),
    )
    assert resp.status_code == 422


# ── Rating tag limits ──────────────────────────────────────────────────────────

async def test_tags_limits_are_enforced(client, user_token):
    # More than 5 tags → 422
    resp = await client.post(
        "/api/v1/ratings",
        json={
            "swap_id": _FAKE_OID,
            "ratee_id": _FAKE_OID,
            "score": 4,
            "review": "Good session",
            "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6"],
        },
        headers=auth(user_token),
    )
    assert resp.status_code == 422

    # Tag longer than 30 chars → 422
    resp = await client.post(
        "/api/v1/ratings",
        json={
            "swap_id": _FAKE_OID,
            "ratee_id": _FAKE_OID,
            "score": 4,
            "review": "Good session",
            "tags": ["a" * 31],
        },
        headers=auth(user_token),
    )
    assert resp.status_code == 422
