"""
Full-flow integration tests for StudySwap.
These tests verify complete real user journeys across multiple parts of the system.
They complement the existing unit-like tests without replacing them.
"""
from datetime import datetime
from tests.conftest import make_user, make_skill, get_token, auth, ADMIN_EMAIL, ADMIN_PASSWORD


# ── Helpers local to this file ────────────────────────────────────────────────

async def register(client, email, password, display_name):
    resp = await client.post("/api/v1/auth/register", json={
        "email": email, "password": password, "display_name": display_name,
    })
    assert resp.status_code == 201, f"Register failed: {resp.text}"
    return resp.json()


async def add_skill(client, token, endpoint, name, category="Programming", level="intermediate"):
    resp = await client.post(f"/api/v1/skills/{endpoint}", json={
        "name": name, "category": category, "level": level, "description": "",
    }, headers=auth(token))
    assert resp.status_code == 201, f"Add skill failed: {resp.text}"
    return resp.json()


async def make_completed_swap(db, sender_id, receiver_id, offered_skill_id, wanted_skill_id):
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


# ── Flow 1: Full mutual learning exchange happy path ─────────────────────────

async def test_full_flow_mutual_learning_exchange_happy_path(client, db):
    """
    Complete end-to-end: two users register, build skills, match, swap, confirm, rate.
    Verifies the entire core value loop of the platform works together.
    """
    # Register both users via API (true end-to-end)
    alice_data = await register(client, "alice@test.com", "alicepass123", "Alice")
    bob_data   = await register(client, "bob@test.com",   "bobpass1234",  "Bob")

    alice_token = alice_data["access_token"]
    bob_token   = bob_data["access_token"]
    alice_id    = alice_data["user"]["id"]
    bob_id      = bob_data["user"]["id"]

    # Both add compatible skills
    alice_offered = await add_skill(client, alice_token, "offered", "Python", "Programming", "advanced")
    alice_wanted  = await add_skill(client, alice_token, "wanted",  "Calculus", "Mathematics", "intermediate")
    bob_offered   = await add_skill(client, bob_token,   "offered", "Calculus", "Mathematics", "advanced")
    bob_wanted    = await add_skill(client, bob_token,   "wanted",  "Python", "Programming", "intermediate")

    # Mutual match should be visible
    matches_resp = await client.get("/api/v1/matches", headers=auth(alice_token))
    assert matches_resp.status_code == 200
    match_ids = [m["user"]["id"] for m in matches_resp.json()["matches"]]
    assert bob_id in match_ids, "Bob should appear as a mutual match for Alice"

    # Alice creates a swap request
    swap_resp = await client.post("/api/v1/swaps", json={
        "receiver_id":      bob_id,
        "offered_skill_id": alice_offered["id"],
        "wanted_skill_id":  bob_offered["id"],
        "session_type":     "online",
    }, headers=auth(alice_token))
    assert swap_resp.status_code == 201
    swap = swap_resp.json()
    swap_id = swap["id"]
    assert swap["status"] == "pending"

    # Bob accepts
    accept_resp = await client.put(f"/api/v1/swaps/{swap_id}/accept", headers=auth(bob_token))
    assert accept_resp.status_code == 200
    assert accept_resp.json()["status"] == "accepted"

    # Both confirm completion
    alice_confirm = await client.put(f"/api/v1/swaps/{swap_id}/confirm", headers=auth(alice_token))
    assert alice_confirm.status_code == 200

    bob_confirm = await client.put(f"/api/v1/swaps/{swap_id}/confirm", headers=auth(bob_token))
    assert bob_confirm.status_code == 200
    assert bob_confirm.json()["status"] == "completed"

    # Alice rates Bob
    rating_resp = await client.post("/api/v1/ratings", json={
        "swap_id":  swap_id,
        "ratee_id": bob_id,
        "score":    5,
        "review":   "Great session, very knowledgeable!",
        "tags":     ["helpful", "clear"],
    }, headers=auth(alice_token))
    assert rating_resp.status_code == 201
    rating = rating_resp.json()
    assert rating["score"] == 5
    assert rating["ratee_id"] == bob_id

    # Verify Bob's aggregate rating updated
    bob_ratings = await client.get(f"/api/v1/ratings/user/{bob_id}")
    assert bob_ratings.json()["avg_rating"] == 5.0
    assert bob_ratings.json()["total"] == 1


# ── Flow 2: Unauthorized and forbidden actions are blocked ────────────────────

async def test_full_flow_unauthorized_and_forbidden_actions_are_blocked(client, db):
    """
    Security flow: verifies that protected routes, admin routes, and cross-user
    actions are all properly blocked at the API level.
    """
    # Create a normal user and an admin
    await make_user(db, email="normal@test.com", password="normalpass1", display_name="Normal")
    await make_user(db, email=ADMIN_EMAIL, password=ADMIN_PASSWORD, display_name="Admin", role="admin")

    normal_token = await get_token(client, "normal@test.com", "normalpass1")

    # Protected route with no token → 401
    resp = await client.get("/api/v1/auth/me")
    assert resp.status_code == 401

    # Protected route with garbage token → 401
    resp = await client.get("/api/v1/auth/me", headers={"Authorization": "Bearer notavalidtoken"})
    assert resp.status_code == 401

    # Normal user hits admin-only endpoint → 403
    resp = await client.get("/api/v1/admin/users", headers=auth(normal_token))
    assert resp.status_code == 403

    resp = await client.post("/api/v1/admin/categories", json={"name": "Hacked"},
                             headers=auth(normal_token))
    assert resp.status_code == 403

    resp = await client.get("/api/v1/admin/swaps", headers=auth(normal_token))
    assert resp.status_code == 403

    # Normal user tries to delete someone else's skill
    other_user = await make_user(db, email="other@test.com", password="otherpass1", display_name="Other")
    skill = await make_skill(db, user_id=str(other_user["_id"]), name="Java")
    resp = await client.delete(f"/api/v1/skills/{str(skill['_id'])}", headers=auth(normal_token))
    assert resp.status_code == 403


# ── Flow 3: Admin moderation of user status ───────────────────────────────────

async def test_full_flow_admin_moderation_of_user_status(client, db):
    """
    Admin flow: admin lists users, changes a user's status, verifies persistence,
    then restores the user and verifies that too.
    """
    admin  = await make_user(db, email=ADMIN_EMAIL, password=ADMIN_PASSWORD, display_name="Admin", role="admin")
    target = await make_user(db, email="target@test.com", password="targetpass1", display_name="Target")
    target_id = str(target["_id"])

    admin_token = await get_token(client, ADMIN_EMAIL, ADMIN_PASSWORD)

    # Admin lists users — both should appear
    list_resp = await client.get("/api/v1/admin/users", headers=auth(admin_token))
    assert list_resp.status_code == 200
    user_ids = [u["id"] for u in list_resp.json()]
    assert target_id in user_ids

    # Admin suspends the target user
    patch_resp = await client.patch(
        f"/api/v1/admin/users/{target_id}/status",
        json={"status": "suspended"},
        headers=auth(admin_token),
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["status"] == "suspended"

    # Status is persisted — confirm via filtered list
    suspended_resp = await client.get("/api/v1/admin/users?status=suspended", headers=auth(admin_token))
    assert any(u["id"] == target_id for u in suspended_resp.json())

    # Admin disables the user
    patch_resp = await client.patch(
        f"/api/v1/admin/users/{target_id}/status",
        json={"status": "disabled"},
        headers=auth(admin_token),
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["status"] == "disabled"

    # Admin restores the user back to active
    restore_resp = await client.patch(
        f"/api/v1/admin/users/{target_id}/status",
        json={"status": "active"},
        headers=auth(admin_token),
    )
    assert restore_resp.status_code == 200
    assert restore_resp.json()["status"] == "active"

    # Confirm active status via full list
    active_resp = await client.get("/api/v1/admin/users?status=active", headers=auth(admin_token))
    assert any(u["id"] == target_id for u in active_resp.json())


# ── Flow 4: Category → skill → browse → swap request ─────────────────────────

async def test_full_flow_category_skill_browse_and_swap_request(client, db):
    """
    Cross-feature flow: admin creates a category, user A adds a skill under it,
    user B discovers A via browse, B creates a swap request, A sees it in their list.
    """
    admin  = await make_user(db, email=ADMIN_EMAIL, password=ADMIN_PASSWORD, display_name="Admin", role="admin")
    user_a = await make_user(db, email="usera@test.com", password="passuserA1", display_name="User A")
    user_b = await make_user(db, email="userb@test.com", password="passuserB1", display_name="User B")

    admin_token = await get_token(client, ADMIN_EMAIL, ADMIN_PASSWORD)
    token_a     = await get_token(client, "usera@test.com", "passuserA1")
    token_b     = await get_token(client, "userb@test.com", "passuserB1")

    # Admin creates a custom category
    cat_resp = await client.post("/api/v1/admin/categories",
                                 json={"name": "Quantum Computing"},
                                 headers=auth(admin_token))
    assert cat_resp.status_code == 200
    assert "Quantum Computing" in cat_resp.json()["categories"]

    # User A adds an offered skill under the new category
    skill_a = await add_skill(client, token_a, "offered", "Quantum Algorithms", "Quantum Computing", "advanced")
    assert skill_a["category"] == "Quantum Computing"

    # User B browses skills and finds User A
    browse_resp = await client.get("/api/v1/browse/users?skill=Quantum")
    assert browse_resp.status_code == 200
    found_ids = [u["id"] for u in browse_resp.json()["users"]]
    assert str(user_a["_id"]) in found_ids

    # User B adds skills so the swap request is valid
    skill_b_offered = await make_skill(db, str(user_b["_id"]), "Linear Algebra", "Mathematics")
    skill_a_wanted  = await make_skill(db, str(user_a["_id"]), "Linear Algebra", "Mathematics", skill_type="wanted")

    # User B sends a swap request to User A
    swap_resp = await client.post("/api/v1/swaps", json={
        "receiver_id":      str(user_a["_id"]),
        "offered_skill_id": str(skill_b_offered["_id"]),
        "wanted_skill_id":  skill_a["id"],
        "session_type":     "online",
    }, headers=auth(token_b))
    assert swap_resp.status_code == 201
    swap_id = swap_resp.json()["id"]

    # User A checks their incoming swaps and finds it
    a_swaps = await client.get("/api/v1/swaps", headers=auth(token_a))
    assert a_swaps.status_code == 200
    swap_ids = [s["id"] for s in a_swaps.json()]
    assert swap_id in swap_ids


# ── Flow 5: Rating delete and re-aggregation ──────────────────────────────────

async def test_full_flow_rating_delete_and_reaggregation(client, db):
    """
    Moderation + integrity flow: two users rate a third, admin deletes one rating,
    and verifies the aggregate is recalculated correctly with no stale state.
    """
    admin  = await make_user(db, email=ADMIN_EMAIL, password=ADMIN_PASSWORD, display_name="Admin", role="admin")
    user_a = await make_user(db, email="rater_a@test.com", password="raterApass1", display_name="Rater A")
    user_b = await make_user(db, email="rater_b@test.com", password="raterBpass1", display_name="Rater B")
    ratee  = await make_user(db, email="ratee@test.com",   password="rateepass11", display_name="Ratee")

    admin_token = await get_token(client, ADMIN_EMAIL, ADMIN_PASSWORD)
    token_a     = await get_token(client, "rater_a@test.com", "raterApass1")
    token_b     = await get_token(client, "rater_b@test.com", "raterBpass1")
    ratee_id    = str(ratee["_id"])

    # Create two completed swaps so both A and B can rate the ratee
    skill_a    = await make_skill(db, str(user_a["_id"]), "Rust")
    skill_b    = await make_skill(db, str(user_b["_id"]), "Go")
    skill_r1   = await make_skill(db, ratee_id, "Python", skill_type="offered")
    skill_r2   = await make_skill(db, ratee_id, "Python", skill_type="offered")

    swap1 = await make_completed_swap(db, user_a["_id"], ratee["_id"], skill_a["_id"], skill_r1["_id"])
    swap2 = await make_completed_swap(db, user_b["_id"], ratee["_id"], skill_b["_id"], skill_r2["_id"])

    # A rates ratee with 5, B rates ratee with 3 → avg should be 4.0
    r1 = await client.post("/api/v1/ratings", json={
        "swap_id": str(swap1["_id"]), "ratee_id": ratee_id, "score": 5, "review": "Excellent", "tags": [],
    }, headers=auth(token_a))
    assert r1.status_code == 201
    rating1_id = r1.json()["id"]

    r2 = await client.post("/api/v1/ratings", json={
        "swap_id": str(swap2["_id"]), "ratee_id": ratee_id, "score": 3, "review": "Decent", "tags": [],
    }, headers=auth(token_b))
    assert r2.status_code == 201

    # Verify initial aggregate: avg=4.0, total=2
    stats = await client.get(f"/api/v1/ratings/user/{ratee_id}")
    assert stats.json()["avg_rating"] == 4.0
    assert stats.json()["total"] == 2

    # Admin deletes the score-5 rating
    del_resp = await client.delete(f"/api/v1/admin/ratings/{rating1_id}", headers=auth(admin_token))
    assert del_resp.status_code == 200

    # Aggregate recalculates: only score-3 remains → avg=3.0, total=1
    stats_after = await client.get(f"/api/v1/ratings/user/{ratee_id}")
    body = stats_after.json()
    assert body["avg_rating"] == 3.0
    assert body["total"] == 1

    # User record is also updated correctly
    user_resp = await client.get(f"/api/v1/users/{ratee_id}")
    assert user_resp.status_code == 200
    user_body = user_resp.json()
    assert user_body["avg_rating"] == 3.0
    assert user_body["total_ratings"] == 1

    # No orphaned ratings remain for the deleted entry
    all_ratings = await db["ratings"].find({"ratee_id": ratee_id}).to_list(None)
    assert len(all_ratings) == 1
    assert all_ratings[0]["score"] == 3
