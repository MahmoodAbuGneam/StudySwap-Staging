# StudySwap

A full-stack academic skill exchange platform. Students and academics teach what they know and learn what they need — no money, just mutual growth.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS + React Router v6 + Axios |
| Backend | FastAPI + Motor (async MongoDB) + python-jose (JWT) + bcrypt |
| Database | MongoDB (localhost:27017, db: `skillswap`) |

---

## Running Locally

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB running on `localhost:27017`

### Option A — One command (Windows)
Double-click `start.bat` in the `skillswap/` folder. Opens two terminal tabs: one for backend, one for frontend.

### Option B — Manual

**Backend**
```bash
cd skillswap/backend
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
uvicorn app.main:app --reload
```
Runs at http://localhost:8000 · Swagger docs at http://localhost:8000/docs

**Frontend**
```bash
cd skillswap/frontend
npm install
npm run dev
```
Runs at http://localhost:5173

---

## Default Admin Account

Seeded automatically on every backend startup:
- **Email:** `administrator@gmail.com`
- **Password:** `Admin@StudySwap1`

---

## Project Structure

```
skillswap/
├── backend/
│   ├── app/
│   │   ├── api/v1/
│   │   │   ├── router.py                  # Central router
│   │   │   └── endpoints/
│   │   │       ├── auth.py                # Register, login, /me
│   │   │       ├── users.py               # GET/PUT user profile
│   │   │       ├── skills.py              # CRUD skills
│   │   │       ├── browse.py              # Browse users & skills
│   │   │       ├── matches.py             # Mutual match discovery
│   │   │       ├── swaps.py               # Swap request lifecycle
│   │   │       ├── favorites.py           # Save/remove favorites
│   │   │       ├── ratings.py             # Submit & view ratings
│   │   │       └── admin.py               # Admin-only endpoints
│   │   ├── core/
│   │   │   ├── config.py                  # Pydantic settings (.env)
│   │   │   └── security.py                # JWT + bcrypt + auth deps
│   │   ├── db/
│   │   │   ├── mongodb.py                 # Motor async client
│   │   │   └── seed.py                    # Seeds default admin on startup
│   │   ├── models/                        # MongoDB document factories
│   │   ├── schemas/                       # Pydantic request/response schemas
│   │   ├── services/
│   │   │   └── matching_service.py        # Swap score algorithm
│   │   └── main.py                        # FastAPI app + startup hook
│   ├── tests/
│   │   ├── conftest.py                    # Shared fixtures (isolated DB per test)
│   │   ├── test_auth.py
│   │   ├── test_users.py
│   │   ├── test_skills.py
│   │   ├── test_swaps.py
│   │   ├── test_matches.py
│   │   ├── test_browse.py
│   │   ├── test_favorites.py
│   │   ├── test_ratings.py
│   │   ├── test_admin.py
│   │   └── test_full_flows.py             # 5 end-to-end integration tests
│   ├── requirements.txt
│   ├── pytest.ini
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── api/                           # Axios service layer (one file per domain)
│   │   │   ├── client.js                  # Axios instance + 401 redirect
│   │   │   ├── auth.js / users.js / skills.js / browse.js
│   │   │   ├── matches.js / swaps.js / favorites.js
│   │   │   ├── ratings.js / admin.js
│   │   ├── components/
│   │   │   ├── AppLayout.jsx              # Sidebar + Outlet shell
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Avatar.jsx
│   │   │   ├── StarRating.jsx
│   │   │   ├── SkillBadge.jsx
│   │   │   ├── ScoreRing.jsx              # SVG swap score ring
│   │   │   ├── TrustBadge.jsx             # Newcomer/Active/Trusted/Top badge
│   │   │   ├── SkillModal.jsx
│   │   │   ├── SwapRequestModal.jsx
│   │   │   ├── RatingModal.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── AdminRoute.jsx
│   │   │   └── Icons.jsx                  # All SVG icon exports
│   │   ├── context/
│   │   │   └── AuthContext.jsx            # JWT in localStorage, refreshUser()
│   │   ├── pages/
│   │   │   ├── Home.jsx                   # Landing page
│   │   │   ├── Login.jsx / Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Browse.jsx
│   │   │   ├── Matches.jsx
│   │   │   ├── Swaps.jsx
│   │   │   ├── Favorites.jsx
│   │   │   ├── ProfileMe.jsx              # Edit own profile
│   │   │   ├── ProfileView.jsx            # View others' profiles
│   │   │   └── admin/
│   │   │       ├── AdminUsers.jsx
│   │   │       ├── AdminSwaps.jsx
│   │   │       ├── AdminRatings.jsx
│   │   │       └── AdminCategories.jsx
│   │   ├── App.jsx                        # Routes definition
│   │   ├── main.jsx
│   │   └── index.css                      # Design tokens + all global styles
│   ├── package.json
│   └── vite.config.js                     # Proxy /api → localhost:8000
└── start.bat                              # Opens two terminal tabs
```

---

## API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/register` | — | Register, returns JWT + user |
| POST | `/api/v1/auth/login` | — | Login via OAuth2 form (username field = email value) |
| GET | `/api/v1/auth/me` | Bearer | Current user |

### Users
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/users/{id}` | — | Public profile (returns 404 for admin accounts) |
| PUT | `/api/v1/users/me` | Bearer | Update own profile |

### Skills
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/skills/offered` | Bearer | Add offered skill |
| POST | `/api/v1/skills/wanted` | Bearer | Add wanted skill |
| GET | `/api/v1/skills/mine` | Bearer | My skills |
| GET | `/api/v1/skills/user/{id}` | — | Anyone's skills (public) |
| PUT | `/api/v1/skills/{id}` | Bearer | Update skill |
| DELETE | `/api/v1/skills/{id}` | Bearer | Delete skill |
| GET | `/api/v1/skills/categories` | — | List all categories |

### Browse
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/browse/users` | — | Browse users (filters: category, skill, level; sorted by rating + credits) |
| GET | `/api/v1/browse/skills` | — | Browse skills |

### Matches
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/matches` | Bearer | Mutual matches with swap scores — returns `{ matches: [...], count: N }` |

### Swaps
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/swaps` | Bearer | Send swap request |
| GET | `/api/v1/swaps` | Bearer | My swaps (sent + received), includes skill names |
| PUT | `/api/v1/swaps/{id}/accept` | Bearer | Accept (receiver only) |
| PUT | `/api/v1/swaps/{id}/reject` | Bearer | Reject (receiver only) |
| PUT | `/api/v1/swaps/{id}/confirm` | Bearer | Mark your side done |
| PUT | `/api/v1/swaps/{id}/cancel` | Bearer | Cancel |

### Favorites
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/favorites/{user_id}` | Bearer | Save user |
| DELETE | `/api/v1/favorites/{user_id}` | Bearer | Unsave user |
| GET | `/api/v1/favorites` | Bearer | List saved profiles |

### Ratings
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/ratings` | Bearer | Submit/update rating (swap must be completed) — upsert |
| GET | `/api/v1/ratings/user/{id}` | — | Ratings for a user |

### Admin (role: admin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/users` | List all users (search + status filter) |
| PATCH | `/api/v1/admin/users/{id}/status` | Change status (active/suspended/disabled) |
| DELETE | `/api/v1/admin/users/{id}` | Delete user + cascade (skills, swaps, favorites, ratings) |
| GET | `/api/v1/admin/swaps` | All swaps (status filter) |
| GET | `/api/v1/admin/ratings` | All ratings |
| DELETE | `/api/v1/admin/ratings/{id}` | Delete rating + re-aggregate user stats |
| GET | `/api/v1/admin/categories` | List categories |
| POST | `/api/v1/admin/categories` | Add category |
| DELETE | `/api/v1/admin/categories/{name}` | Remove category |

---

## Key Design Decisions

**Credits / Contribution Score**
- Purely informational — each completed swap awards +1 credit to both users
- Never blocks or gates any action
- Used as secondary sort in browse and matches (tiebreaker after rating/swap score)
- Displayed as "Contribution Score" in the UI (not "Credits")

**Trust Badges** (computed from credits via `get_badge()` in `schemas/user.py`)
| Credits | Badge |
|---------|-------|
| 0–2 | Newcomer |
| 3–7 | Active Learner |
| 8–15 | Trusted Peer |
| 16+ | Top Contributor |

**Matching Algorithm** (`services/matching_service.py`)
- Mutual only: A must offer what B wants AND B must offer what A wants
- Score 0–100 across 5 factors:
  - Need fulfillment rate (0–50 pts)
  - Level compatibility (0–20 pts)
  - Session type overlap (0–15 pts)
  - Availability day overlap (0–10 pts)
  - Deadline urgency bonus (0–5 pts)

**Swap Lifecycle**
```
pending → accepted → [sender_confirmed + receiver_confirmed] → completed
       ↘ rejected
       ↘ cancelled
```
Ratings only unlock after status = `completed`.

**Admin Protections**
- `administrator@gmail.com` cannot be deleted by anyone
- Admins cannot delete their own account
- Deleting a user cascades: removes their skills, swaps, favorites entries, ratings
- Admins are hidden from browse, matches, favorites, and profile views for regular users

---

## Running Tests

```bash
cd skillswap/backend
venv\Scripts\activate
pytest
```

55 tests total: 50 unit/integration tests across 9 files + 5 full end-to-end flow tests. Each test runs against an isolated MongoDB database that is dropped after completion.
