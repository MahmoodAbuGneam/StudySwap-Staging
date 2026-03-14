from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.mongodb import connect_db, close_db, get_db
from app.db.seed import seed_admin
from app.api.v1.router import api_router

app = FastAPI(
    title="StudySwap API",
    version="1.0.0",
    description="Academic skill exchange platform",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await connect_db()
    db = await get_db()
    await seed_admin(db)


@app.on_event("shutdown")
async def shutdown():
    await close_db()


app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"message": "StudySwap API is running", "docs": "/docs"}
