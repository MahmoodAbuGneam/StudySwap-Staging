"""
Tests for the matching system:
  - Unit tests for compute_swap_score()
  - API tests for GET /api/v1/matches
"""
from app.services.matching_service import compute_swap_score
from tests.conftest import make_user, make_skill, auth, get_token, USER_EMAIL, USER_PASSWORD


# ── Unit tests: compute_swap_score ────────────────────────────────────────────

def test_swap_score_returns_valid_range():
    """Score must always land in [0, 100]."""
    me = {
        "session_types": ["online"],
        "availability": [{"day": "monday"}, {"day": "wednesday"}],
    }
    them = {
        "session_types": ["online"],
        "availability": [{"day": "monday"}, {"day": "friday"}],
    }
    my_skills = [
        {"type": "offered", "name": "Python",   "category": "Programming", "level": "intermediate"},
        {"type": "wanted",  "name": "Calculus",  "category": "Mathematics", "level": "beginner"},
    ]
    their_skills = [
        {"type": "offered", "name": "Calculus",  "category": "Mathematics", "level": "intermediate"},
        {"type": "wanted",  "name": "Python",    "category": "Programming", "level": "intermediate"},
    ]
    score = compute_swap_score(my_skills, their_skills, me, them)
    assert 0 <= score <= 100


def test_swap_score_reflects_better_compatibility():
    """A perfectly-matched pair should score higher than a weakly-matched pair."""
    # Perfect match: same session type, overlapping availability, exact name & same level
    me_perfect = {
        "session_types": ["online"],
        "availability": [{"day": "monday"}, {"day": "tuesday"}],
    }
    them_perfect = {
        "session_types": ["online"],
        "availability": [{"day": "monday"}, {"day": "tuesday"}],
    }
    my_skills_perfect = [
        {"type": "offered", "name": "Python",   "category": "Programming", "level": "advanced"},
        {"type": "wanted",  "name": "Calculus", "category": "Mathematics", "level": "advanced"},
    ]
    their_skills_perfect = [
        {"type": "offered", "name": "Calculus", "category": "Mathematics", "level": "advanced"},
        {"type": "wanted",  "name": "Python",   "category": "Programming", "level": "advanced"},
    ]
    perfect_score = compute_swap_score(my_skills_perfect, their_skills_perfect, me_perfect, them_perfect)

    # Weak match: different session types, no availability overlap
    me_weak = {
        "session_types": ["online"],
        "availability": [{"day": "monday"}],
    }
    them_weak = {
        "session_types": ["in-person"],
        "availability": [{"day": "friday"}],
    }
    # Different levels so level compat is lower too
    my_skills_weak = [
        {"type": "offered", "name": "Python",   "category": "Programming", "level": "beginner"},
        {"type": "wanted",  "name": "Calculus", "category": "Mathematics", "level": "advanced"},
    ]
    their_skills_weak = [
        {"type": "offered", "name": "Calculus", "category": "Mathematics", "level": "beginner"},
        {"type": "wanted",  "name": "Python",   "category": "Programming", "level": "advanced"},
    ]
    weak_score = compute_swap_score(my_skills_weak, their_skills_weak, me_weak, them_weak)

    assert perfect_score > weak_score


# ── API tests: GET /api/v1/matches ────────────────────────────────────────────

async def test_mutual_match_is_detected(client, db):
    """
    User A offers Python / wants Calculus.
    User B offers Calculus / wants Python.
    When A queries /matches, B should appear in the results.
    """
    user_a = await make_user(db, email="a@test.com", display_name="User A")
    user_b = await make_user(db, email="b@test.com", display_name="User B")

    a_id = str(user_a["_id"])
    b_id = str(user_b["_id"])

    await make_skill(db, user_id=a_id, name="Python",   category="Programming", level="intermediate", skill_type="offered")
    await make_skill(db, user_id=a_id, name="Calculus", category="Mathematics", level="intermediate", skill_type="wanted")
    await make_skill(db, user_id=b_id, name="Calculus", category="Mathematics", level="intermediate", skill_type="offered")
    await make_skill(db, user_id=b_id, name="Python",   category="Programming", level="intermediate", skill_type="wanted")

    token_a = await get_token(client, "a@test.com", USER_PASSWORD)
    resp = await client.get("/api/v1/matches", headers=auth(token_a))

    assert resp.status_code == 200
    data = resp.json()
    matched_ids = [m["user"]["id"] for m in data["matches"]]
    assert b_id in matched_ids


async def test_non_mutual_match_is_not_treated_as_strong_match(client, db):
    """
    One-sided scenario: A offers Python and wants Calculus.
    B offers Python but does NOT want Calculus (B cannot teach what A wants).
    Because the match is not mutual, B should NOT appear in A's matches at all
    (find_mutual_matches requires i_can_teach to be True).
    """
    user_a = await make_user(db, email="a@test.com", display_name="User A")
    user_b = await make_user(db, email="b@test.com", display_name="User B")

    a_id = str(user_a["_id"])
    b_id = str(user_b["_id"])

    await make_skill(db, user_id=a_id, name="Python",   category="Programming", level="intermediate", skill_type="offered")
    await make_skill(db, user_id=a_id, name="Calculus", category="Mathematics", level="intermediate", skill_type="wanted")

    # B offers Python (matches A's want? No — A wants Calculus, not Python)
    # B has NO wanted skills, so A cannot teach B anything either
    await make_skill(db, user_id=b_id, name="Python", category="Programming", level="intermediate", skill_type="offered")

    token_a = await get_token(client, "a@test.com", USER_PASSWORD)
    resp = await client.get("/api/v1/matches", headers=auth(token_a))

    assert resp.status_code == 200
    data = resp.json()
    matched_ids = [m["user"]["id"] for m in data["matches"]]
    # B offers Python but A wants Calculus — no overlap; and B wants nothing A offers.
    # The service filters out non-mutual candidates, so B must not appear.
    assert b_id not in matched_ids
