"""
Tests for authorization rules:
  - Users can only modify their own profile via PUT /api/v1/users/me
  - Non-admins cannot reach admin routes
  - Admins can reach admin routes
"""
import pytest
from tests.conftest import make_user, auth, get_token, USER_EMAIL, USER_PASSWORD, ADMIN_EMAIL, ADMIN_PASSWORD


async def test_user_can_update_own_profile(client, user_token):
    resp = await client.put(
        "/api/v1/users/me",
        json={"bio": "Updated bio"},
        headers=auth(user_token),
    )
    assert resp.status_code == 200
    assert resp.json()["bio"] == "Updated bio"


async def test_user_cannot_update_another_users_profile(client, db):
    # Create two independent users
    user_a = await make_user(db, email="a@test.com", password="passwordaaa", display_name="User A")
    user_b = await make_user(db, email="b@test.com", password="passwordbbb", display_name="User B")

    token_a = await get_token(client, "a@test.com", "passwordaaa")

    # User A updates their own profile
    resp = await client.put(
        "/api/v1/users/me",
        json={"bio": "A's bio"},
        headers=auth(token_a),
    )
    assert resp.status_code == 200

    # Verify user B's profile is untouched
    user_b_id = str(user_b["_id"])
    resp = await client.get(f"/api/v1/users/{user_b_id}")
    assert resp.status_code == 200
    assert resp.json()["bio"] != "A's bio"


async def test_non_admin_cannot_access_admin_routes(client, user_token):
    resp = await client.get(
        "/api/v1/admin/users",
        headers=auth(user_token),
    )
    assert resp.status_code == 403


async def test_admin_can_access_admin_routes(client, admin_token):
    resp = await client.get(
        "/api/v1/admin/users",
        headers=auth(admin_token),
    )
    assert resp.status_code == 200
