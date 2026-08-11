from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import jwt
from datetime import datetime, timedelta

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin

router = APIRouter()


@router.post("/signup")
def signup(user: UserCreate, db: Session = Depends(get_db)):

    new_user = User(
        username=user.username,
        email=user.email,
        password=user.password
    )

    db.add(new_user)

    try:
        db.commit()

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Username or email is already registered"
        )

    db.refresh(new_user)

    return {
        "message": "User created successfully",
        "username": new_user.username,
        "email": new_user.email
    }


@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):

    db_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if not db_user:
        raise HTTPException(
            status_code=400,
            detail="Invalid email or password"
        )

    if db_user.password != user.password:
        raise HTTPException(
            status_code=400,
            detail="Invalid email or password"
        )

    token_data = {
        "user_id": db_user.id,
        "email": db_user.email,
        "exp": datetime.utcnow() + timedelta(hours=1)
    }

    token = jwt.encode(
        token_data,
        "my-secret-key",
        algorithm="HS256"
    )

    return {
        "message": "Login successful",
        "username": db_user.username,
        "email": db_user.email,
        "access_token": token,
        "token_type": "bearer"
    }