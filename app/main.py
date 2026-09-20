from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.models.user import User
from app.models.tournament import Tournament
from app.models.team import Team
from app.models.match import Match

from app.api.users import router as users_router
from app.api.tournaments import router as tournaments_router
from app.api.teams import router as teams_router
from app.api.matches import router as matches_router
from app.api.leaderboard import router as leaderboard_router
from app.api.registration import router as registration_router
from app.api.admin import router as admin_router


# Create database tables
Base.metadata.create_all(bind=engine)


# Create FastAPI application
app = FastAPI(
    title="Esports Management System",
    version="1.0.0"
)


# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://esports-management-system.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# API routers
app.include_router(users_router)
app.include_router(tournaments_router)
app.include_router(teams_router)
app.include_router(matches_router)
app.include_router(leaderboard_router)
app.include_router(registration_router)
app.include_router(admin_router)


# Root endpoint
@app.get("/")
def home():
    return {
        "message": "Esports Management System API is running"
    }


# Health check endpoint
@app.get("/health")
def health():
    return {
        "status": "OK",
        "service": "Esports Management System API"
    }