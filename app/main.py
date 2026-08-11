from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.models.user import User
from app.models.tournament import Tournament

from app.api.users import router as users_router
from app.api.tournaments import router as tournaments_router


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Esports Management System",
    version="1.0.0"
)


# Allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(users_router)
app.include_router(tournaments_router)


@app.get("/")
def home():
    return {
        "message": "Esports Management System API is running"
    }