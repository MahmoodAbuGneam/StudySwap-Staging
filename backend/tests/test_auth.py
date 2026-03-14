"""
Tests for authentication endpoints:
  POST /api/v1/auth/register
  POST /api/v1/auth/login
  GET  /api/v1/auth/me
"""
import pytest
from tests.conftest import make_user, auth, USER_EMAIL, USER_PASSWORD


# ── Registration ───────────────────────────────────────────────────────────────

async def test_register_user_success(client):
    resp = await client.post(
        "/api/v1/auth/register",
        json={"email": "new@test.com", "password": "securepassword1", "display_name": "New User"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert "access_token" in body
    assert body["user"]["email"] == "new@test.com"
    assert body["user"]["display_name"] == "New User"


async def test_register_rejects_duplicate_email(client):
    payload = {"email": "dup@test.com", "password": "securepassword1", "display_name": "Dup User"}
    first = await client.post("/api/v1/auth/register", json=payload)
    assert first.status_code == 201

    second = await client.post("/api/v1/auth/register", json=payload)
    assert second.status_code == 400


async def test_register_rejects_invalid_input(client):
    # Bad email format
    resp = await client.post(
        "/api/v1/auth/register",
        json={"email": "notanemail", "password": "securepassword1", "display_name": "Valid Name"},
    )
    assert resp.status_code == 422

    # Password too short (less than 8 chars)
    resp = await client.post(
        "/api/v1/auth/register",
        json={"email": "short@test.com", "password": "1234567", "display_name": "Valid Name"},
    )
    assert resp.status_code == 422

    # display_name too short (1 char)
    resp = await client.post(
        "/api/v1/auth/register",
        json={"email": "name@test.com", "password": "securepassword1", "display_name": "A"},
    )
    assert resp.status_code == 422


# ── Login ──────────────────────────────────────────────────────────────────────

async def test_login_success(client, db):
    await make_user(db, email=USER_EMAIL, password=USER_PASSWORD)
    resp = await client.post(
        "/api/v1/auth/login",
        data={"username": USER_EMAIL, "password": USER_PASSWORD},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "access_token" in body
    assert "role" in body["user"]


async def test_login_rejects_wrong_password(client, db):
    await make_user(db, email=USER_EMAIL, password=USER_PASSWORD)
    resp = await client.post(
        "/api/v1/auth/login",
        data={"username": USER_EMAIL, "password": "wrongpassword"},
    )
    assert resp.status_code == 401


async def test_login_rejects_unknown_user(client):
    resp = await client.post(
        "/api/v1/auth/login",
        data={"username": "nobody@test.com", "password": "somepassword"},
    )
    assert resp.status_code == 401


# ── Protected routes ───────────────────────────────────────────────────────────

async def test_protected_route_requires_authentication(client):
    resp = await client.get("/api/v1/auth/me")
    assert resp.status_code == 401


async def test_invalid_token_is_rejected(client):
    resp = await client.get(
        "/api/v1/auth/me",
        headers=auth("invalidtoken123"),
    )
    assert resp.status_code == 401
