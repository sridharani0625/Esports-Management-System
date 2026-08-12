from pydantic import BaseModel


class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: str = "PLAYER"


class UserLogin(BaseModel):
    email: str
    password: str