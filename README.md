# StudySwap

Academic skill exchange platform. Students and academics teach what they know and learn what they need — no money, just mutual growth.

## Stack

- **Frontend**: React 18 + Vite + Tailwind CSS + React Router v6 + Axios
- **Backend**: FastAPI + Motor (async MongoDB) + python-jose (JWT) + passlib (bcrypt)
- **Database**: MongoDB

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB running locally on port 27017

### Backend

```bash
cd skillswap/backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend runs at http://localhost:8000
Swagger docs at http://localhost:8000/docs

### Frontend

```bash
cd skillswap/frontend
npm install
npm run dev
```

Frontend runs at http://localhost:5173

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/auth/register | Register new user |
| POST | /api/v1/auth/login | Login (OAuth2 form) |
| GET | /api/v1/auth/me | Get current user |
| GET | /api/v1/users/{id} | Get user profile |
| PUT | /api/v1/users/me | Update own profile |
| POST | /api/v1/skills/offered | Add offered skill |
| POST | /api/v1/skills/wanted | Add wanted skill |
| GET | /api/v1/skills/mine | List my skills |
| PUT | /api/v1/skills/{id} | Update skill |
| DELETE | /api/v1/skills/{id} | Delete skill |
| GET | /api/v1/browse/users | Browse users with filters |
| GET | /api/v1/browse/skills | Browse skills with filters |
| GET | /api/v1/matches | Get mutual matches with swap scores |
| POST | /api/v1/swaps | Send swap request |
| PUT | /api/v1/swaps/{id}/accept | Accept swap |
| PUT | /api/v1/swaps/{id}/reject | Reject swap |
| PUT | /api/v1/swaps/{id}/confirm | Mark your side done |
| PUT | /api/v1/swaps/{id}/cancel | Cancel swap |
| GET | /api/v1/swaps | List my swaps |
| POST | /api/v1/favorites/{user_id} | Add to favorites |
| DELETE | /api/v1/favorites/{user_id} | Remove from favorites |
| GET | /api/v1/favorites | List favorites |
| POST | /api/v1/ratings | Submit rating (after completed swap) |
| GET | /api/v1/ratings/user/{id} | Get ratings for user |

---

## Key Design Decisions

- **Credits**: Soft/informational only — tracked on profile for trust, never block swaps
- **Matching**: Mutual only — A teaches what B wants AND B teaches what A wants
- **Completion**: Both users must confirm done → ratings unlock for both
- **Swap Score**: 0–100, factors: skill overlap, level compatibility, deadline urgency, session type match, availability overlap
- **Session Type**: Set on profile as preference, chosen per swap request

---

## Verification Flow

1. Register two users (Alice & Bob)
2. Alice adds offered: "Python" (Programming, intermediate)
3. Bob adds offered: "Linear Algebra" (Mathematics, intermediate)
4. Alice adds wanted: "Linear Algebra" (Mathematics)
5. Bob adds wanted: "Python" (Programming)
6. Both call GET /api/v1/matches → each appears as mutual match
7. Alice sends swap request to Bob
8. Bob accepts → both confirm → status = completed
9. Both submit ratings → check profile summary
