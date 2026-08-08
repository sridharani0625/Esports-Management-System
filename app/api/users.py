from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

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