from fastapi import FastAPI

from app.database import Base, engine
from app.models.user import User
from app.api.users import router as users_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Esports Management System",
    version="1.0.0"
)


app.include_router(users_router)


@app.get("/")
def home():
    return {
        "message": "Esports Management System API is running"
    }