"""
Tests for favorites endpoints:
  POST   /api/v1/favorites/{user_id}  — add favorite
  DELETE /api/v1/favorites/{user_id}  — remove favorite
  GET    /api/v1/favorites             — list favorites
"""
from tests.conftest import make_user, make_skill, auth, get_token, USER_EMAIL, USER_PASSWORD


async def test_user_can_add_favorite(client, db):
    """User A can favorite user B; B then appears in A's favorites list."""
    user_a = await make_user(db, email="a@test.com", display_name="User A")
    user_b = await make_user(db, email="b@test.com", display_name="User B")

    b_id = str(user_b["_id"])
    token_a = await get_token(client, "a@test.com", USER_PASSWORD)

    # Add B to A's favorites
    add_resp = await client.post(
        f"/api/v1/favorites/{b_id}",
        headers=auth(token_a),
    )
    assert add_resp.status_code in (200, 201)

    # Verify B appears in the favorites list
    list_resp = await client.get("/api/v1/favorites", headers=auth(token_a))
    assert list_resp.status_code == 200
    fav_ids = [f["id"] for f in list_resp.json()["favorites"]]
    assert b_id in fav_ids


async def test_user_can_remove_favorite(client, db):
    """After removing a favorite, the user no longer appears in the list."""
    user_a = await make_user(db, email="a@test.com", display_name="User A")
    user_b = await make_user(db, email="b@test.com", display_name="User B")

    b_id = str(user_b["_id"])
    token_a = await get_token(client, "a@test.com", USER_PASSWORD)

    # First add B
    await client.post(f"/api/v1/favorites/{b_id}", headers=auth(token_a))

    # Then remove B
    del_resp = await client.delete(f"/api/v1/favorites/{b_id}", headers=auth(token_a))
    assert del_resp.status_code == 200

    # Verify B is no longer in the list
    list_resp = await client.get("/api/v1/favorites", headers=auth(token_a))
    assert list_resp.status_code == 200
    fav_ids = [f["id"] for f in list_resp.json()["favorites"]]
    assert b_id not in fav_ids


async def test_user_cannot_favorite_invalid_user(client, user_token):
    """Attempting to favorite a non-existent (but validly-formatted) ID returns 404."""
    nonexistent_id = "000000000000000000000000"
    resp = await client.post(
        f"/api/v1/favorites/{nonexistent_id}",
        headers=auth(user_token),
    )
    assert resp.status_code == 404
