"""
Tests for skill-related endpoints:
  POST /api/v1/skills/offered
  POST /api/v1/skills/wanted
  GET  /api/v1/skills/mine
  PUT  /api/v1/skills/{skill_id}
  DELETE /api/v1/skills/{skill_id}
  GET  /api/v1/admin/categories
  POST /api/v1/admin/categories
"""
from tests.conftest import make_user, make_skill, auth, get_token, USER_EMAIL, USER_PASSWORD, ADMIN_EMAIL, ADMIN_PASSWORD

VALID_SKILL = {
    "name": "Python",
    "category": "Programming",
    "level": "intermediate",
    "description": "",
}


async def test_user_can_add_offered_skill(client, user_token):
    resp = await client.post(
        "/api/v1/skills/offered",
        json=VALID_SKILL,
        headers=auth(user_token),
    )
    assert resp.status_code == 201
    data = resp.json()
    assert "id" in data
    assert data["name"] == "Python"
    assert data["type"] == "offered"


async def test_user_can_add_wanted_skill(client, user_token):
    resp = await client.post(
        "/api/v1/skills/wanted",
        json=VALID_SKILL,
        headers=auth(user_token),
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["type"] == "wanted"


async def test_skill_rejects_invalid_level(client, user_token):
    bad_skill = {**VALID_SKILL, "level": "expert"}
    resp = await client.post(
        "/api/v1/skills/offered",
        json=bad_skill,
        headers=auth(user_token),
    )
    assert resp.status_code == 422


async def test_skill_rejects_invalid_session_type(client, user_token):
    # session_type is not part of SkillCreate; instead test that a name shorter
    # than 2 chars is rejected (min_length=2 on the name field).
    bad_skill = {**VALID_SKILL, "name": "A"}
    resp = await client.post(
        "/api/v1/skills/offered",
        json=bad_skill,
        headers=auth(user_token),
    )
    assert resp.status_code == 422


async def test_admin_can_create_category(client, db, admin_user):
    token = await get_token(client, ADMIN_EMAIL, ADMIN_PASSWORD)
    resp = await client.post(
        "/api/v1/admin/categories",
        json={"name": "Test Category"},
        headers=auth(token),
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "Test Category" in data["categories"]


async def test_non_admin_cannot_create_category(client, user_token):
    resp = await client.post(
        "/api/v1/admin/categories",
        json={"name": "Test Category"},
        headers=auth(user_token),
    )
    assert resp.status_code == 403
