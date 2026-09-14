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


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Esports Management System",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


app.include_router(users_router)
app.include_router(tournaments_router)
app.include_router(teams_router)
app.include_router(matches_router)
app.include_router(leaderboard_router)
app.include_router(registration_router)


@app.get("/")
def home():
    return {
        "message": "Esports Management System API is running"
    }