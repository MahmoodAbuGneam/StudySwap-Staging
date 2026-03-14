from typing import List, Dict, Any
from datetime import datetime, date
from app.schemas.user import get_badge


LEVEL_ORDER = {"beginner": 0, "intermediate": 1, "advanced": 2}


def _name_match(a: dict, b: dict) -> bool:
    """True if two skills refer to the same topic (by name or category)."""
    return (
        a["name"].strip().lower() == b["name"].strip().lower()
        or a["category"] == b["category"]
    )


def _level_compat(offered: dict, wanted: dict) -> float:
    """
    Returns 0.0–1.0 based on how well the offered level meets the wanted level.
    Same level = 1.0, 1 apart = 0.5, 2 apart = 0.0
    """
    diff = abs(LEVEL_ORDER.get(offered["level"], 1) - LEVEL_ORDER.get(wanted["level"], 1))
    return max(0.0, 1.0 - diff * 0.5)


def compute_swap_score(
    my_skills: List[dict],
    their_skills: List[dict],
    me: dict,
    them: dict,
) -> int:
    my_offered  = [s for s in my_skills    if s["type"] == "offered"]
    my_wanted   = [s for s in my_skills    if s["type"] == "wanted"]
    their_offered = [s for s in their_skills if s["type"] == "offered"]
    their_wanted  = [s for s in their_skills if s["type"] == "wanted"]

    # ── Build matched pairs in both directions ─────────────────────────────────
    # Each pair: (offered_skill, wanted_skill, compat_score 0-1)
    pairs_they_teach_me = []
    for ts in their_offered:
        for mw in my_wanted:
            if _name_match(ts, mw):
                pairs_they_teach_me.append((ts, mw, _level_compat(ts, mw)))

    pairs_i_teach_them = []
    for ms in my_offered:
        for tw in their_wanted:
            if _name_match(ms, tw):
                pairs_i_teach_them.append((ms, tw, _level_compat(ms, tw)))

    # ── Factor 1: Need-fulfillment rate (0–50 pts) ─────────────────────────────
    # "How much of each person's wanted list is actually covered?"
    #
    # We deduplicate by the *wanted* skill so one offered skill doesn't
    # artificially inflate coverage of the same want multiple times.
    my_wants_covered    = {mw["_id"] if "_id" in mw else mw.get("id", mw["name"])
                           for (_, mw, _) in pairs_they_teach_me}
    their_wants_covered = {tw["_id"] if "_id" in tw else tw.get("id", tw["name"])
                           for (_, tw, _) in pairs_i_teach_them}

    my_need_rate    = min(len(my_wants_covered)    / max(len(my_wanted),    1), 1.0)
    their_need_rate = min(len(their_wants_covered) / max(len(their_wanted), 1), 1.0)

    # Both sides must be covered for a high score (geometric-ish mean).
    # Pure average would reward a strong one-sided match too much.
    fulfillment = (my_need_rate + their_need_rate) / 2
    # Extra boost if BOTH sides are 100% covered
    if my_need_rate == 1.0 and their_need_rate == 1.0:
        fulfillment = 1.0
    fulfillment_score = fulfillment * 50  # 0–50

    # ── Factor 2: Level compatibility (0–20 pts) ───────────────────────────────
    # Average compat across ALL matched pairs in both directions.
    all_compats = [c for (_, _, c) in pairs_they_teach_me + pairs_i_teach_them]
    avg_compat  = sum(all_compats) / max(len(all_compats), 1)
    level_score = avg_compat * 20  # 0–20

    # ── Factor 3: Session type overlap (0–15 pts) ──────────────────────────────
    my_types    = set(me.get("session_types", []))
    their_types = set(them.get("session_types", []))
    session_score = 15 if (my_types & their_types) else 0

    # ── Factor 4: Availability overlap (0–10 pts) ──────────────────────────────
    my_days    = {a.get("day", "") for a in me.get("availability",   [])}
    their_days = {a.get("day", "") for a in them.get("availability", [])}
    union      = my_days | their_days
    if union:
        overlap_ratio = len(my_days & their_days) / len(union)
        avail_score   = overlap_ratio * 10
    else:
        avail_score = 0  # neither has set availability → neutral, not a penalty

    # ── Factor 5: Deadline urgency bonus (0–5 pts) ────────────────────────────
    urgency_score = 0
    for s in my_wanted + their_wanted:
        if s.get("deadline"):
            try:
                dl        = datetime.fromisoformat(s["deadline"]).date()
                days_left = (dl - date.today()).days
                if 0 <= days_left <= 30:
                    urgency_score += 5
                elif days_left <= 90:
                    urgency_score += 2
            except Exception:
                pass
    urgency_score = min(urgency_score, 5)

    total = fulfillment_score + level_score + session_score + avail_score + urgency_score
    return min(max(int(round(total)), 0), 100)


async def find_mutual_matches(current_user: dict, db) -> List[Dict[str, Any]]:
    my_id    = str(current_user["_id"])
    my_skills = await db["skills"].find({"user_id": my_id}).to_list(None)

    my_offered_names = {s["name"].strip().lower() for s in my_skills if s["type"] == "offered"}
    my_offered_cats  = {s["category"]              for s in my_skills if s["type"] == "offered"}
    my_wanted_names  = {s["name"].strip().lower()  for s in my_skills if s["type"] == "wanted"}
    my_wanted_cats   = {s["category"]              for s in my_skills if s["type"] == "wanted"}

    if not (my_offered_names or my_offered_cats):
        return []
    if not (my_wanted_names or my_wanted_cats):
        return []

    # Candidates: users who offer at least one thing I want
    potential = await db["skills"].find(
        {"type": "offered", "user_id": {"$ne": my_id}}
    ).to_list(None)

    candidate_ids = set()
    for s in potential:
        if s["name"].strip().lower() in my_wanted_names or s["category"] in my_wanted_cats:
            candidate_ids.add(s["user_id"])

    from bson import ObjectId

    # Fetch all candidate user docs at once, excluding admins
    from bson import ObjectId as _OID
    candidate_user_docs = await db["users"].find(
        {"_id": {"$in": [_OID(cid) for cid in candidate_ids if len(cid) == 24]},
         "role": {"$ne": "admin"}}
    ).to_list(None)
    valid_candidate_ids = {str(u["_id"]): u for u in candidate_user_docs}

    matches = []
    for cid in candidate_ids:
        if cid not in valid_candidate_ids:
            continue
        their_skills = await db["skills"].find({"user_id": cid}).to_list(None)
        their_wanted_names = {s["name"].strip().lower() for s in their_skills if s["type"] == "wanted"}
        their_wanted_cats  = {s["category"]             for s in their_skills if s["type"] == "wanted"}

        # Must also want something I offer (true mutual match)
        i_can_teach = (
            any(n in their_wanted_names for n in my_offered_names)
            or any(c in their_wanted_cats  for c in my_offered_cats)
        )
        if not i_can_teach:
            continue

        them = valid_candidate_ids.get(cid)
        if not them:
            continue

        score = compute_swap_score(my_skills, their_skills, current_user, them)

        # Build readable skill lists for the response
        they_can_teach_me = [
            {"id": str(s["_id"]), "name": s["name"], "category": s["category"], "level": s["level"]}
            for s in their_skills
            if s["type"] == "offered" and (
                s["name"].strip().lower() in my_wanted_names or s["category"] in my_wanted_cats
            )
        ]
        i_can_teach_them = [
            {"id": str(s["_id"]), "name": s["name"], "category": s["category"], "level": s["level"]}
            for s in my_skills
            if s["type"] == "offered" and (
                s["name"].strip().lower() in their_wanted_names or s["category"] in their_wanted_cats
            )
        ]

        credits = them.get("credits", 0)
        matches.append({
            "user": {
                "id":             cid,
                "display_name":   them["display_name"],
                "bio":            them.get("bio", ""),
                "academic_field": them.get("academic_field", ""),
                "avatar_url":     them.get("avatar_url", ""),
                "session_types":  them.get("session_types", []),
                "avg_rating":     them.get("avg_rating", 0.0),
                "total_ratings":  them.get("total_ratings", 0),
                "credits":        credits,
                "badge":          get_badge(credits),
            },
            "swap_score":        score,
            "they_can_teach_me": they_can_teach_me,
            "i_can_teach_them":  i_can_teach_them,
        })

    matches.sort(key=lambda m: (m["swap_score"], m["user"].get("credits", 0)), reverse=True)
    return matches
