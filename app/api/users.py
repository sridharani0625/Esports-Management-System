
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func
import jwt
from datetime import datetime, timedelta
from passlib.context import CryptContext
import re

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

SECRET_KEY = os.getenv("JWT_SECRET_KEY")


# =========================
# VALIDATION
# =========================

def validate_email(email: str):
    email = email.strip()

    pattern = r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"

    if not re.match(pattern, email):
        raise HTTPException(
            status_code=400,
            detail="Please enter a valid email address"
        )


def validate_password(password: str):
    if len(password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least 8 characters"
        )

    if not re.search(r"[A-Z]", password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one uppercase letter"
        )

    if not re.search(r"[a-z]", password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one lowercase letter"
        )

    if not re.search(r"\d", password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one number"
        )

    if not re.search(r"[^A-Za-z0-9]", password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one special character"
        )


# =========================
# JWT AUTHENTICATION
# =========================

def get_current_user(authorization: str = Header(None)):

    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization token required"
        )

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header"
        )

    token = authorization.split(" ")[1]

    try:
        return jwt.decode(
            token,
            SECRET_KEY,
            algorithms=["HS256"]
        )

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Token has expired"
        )

    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )


# =========================
# SIGNUP
# =========================

@router.post("/signup")
def signup(
    user: UserCreate,
    db: Session = Depends(get_db)
):

    # ADMIN cannot be created through public signup
    if user.role == "ADMIN":
        raise HTTPException(
            status_code=403,
            detail="Admin accounts cannot be created through signup"
        )

    # Only these roles are allowed through signup
    allowed_roles = [
        "PLAYER",
        "TEAM_MANAGER",
        "ORGANIZER"
    ]

    if user.role not in allowed_roles:
        raise HTTPException(
            status_code=400,
            detail="Invalid role selected"
        )

    username = user.username.strip()
    email = user.email.strip().lower()

    if not username:
        raise HTTPException(
            status_code=400,
            detail="Username cannot be empty"
        )

    if len(username) < 3:
        raise HTTPException(
            status_code=400,
            detail="Username must contain at least 3 characters"
        )

    validate_email(email)
    validate_password(user.password)

    # Username duplicate check
    existing_username = db.query(User).filter(
        func.lower(User.username) == username.lower()
    ).first()

    if existing_username:
        raise HTTPException(
            status_code=400,
            detail="Username already exists. Please choose another username."
        )

    # Email duplicate check
    existing_email = db.query(User).filter(
        func.lower(User.email) == email
    ).first()

    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="Email is already registered. Please use another email."
        )

    new_user = User(
        username=username,
        email=email,
        password=pwd_context.hash(user.password),
        role=user.role
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
        "email": new_user.email,
        "role": new_user.role
    }


# =========================
# LOGIN
# =========================

@router.post("/login")
def login(
    user: UserLogin,
    db: Session = Depends(get_db)
):

    email = user.email.strip().lower()

    db_user = db.query(User).filter(
        func.lower(User.email) == email
    ).first()

    if not db_user:
        raise HTTPException(
            status_code=400,
            detail="Invalid email or password"
        )

    if not pwd_context.verify(
        user.password,
        db_user.password
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid email or password"
        )

    token_data = {
        "user_id": db_user.id,
        "email": db_user.email,
        "role": db_user.role,
        "exp": datetime.utcnow() + timedelta(hours=1)
    }

    token = jwt.encode(
        token_data,
        SECRET_KEY,
        algorithm="HS256"
    )

    return {
        "message": "Login successful",
        "user_id": db_user.id,
        "username": db_user.username,
        "email": db_user.email,
        "role": db_user.role,
        "access_token": token,
        "token_type": "bearer"
    }


# =========================
# UPDATE OWN PROFILE
# =========================

@router.put("/profile")
def update_profile(
    username: str,
    email: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    user_id = current_user.get("user_id")

    username = username.strip()
    email = email.strip().lower()

    if not username:
        raise HTTPException(
            status_code=400,
            detail="Username cannot be empty"
        )

    if len(username) < 3:
        raise HTTPException(
            status_code=400,
            detail="Username must contain at least 3 characters"
        )

    validate_email(email)

    # Check username belongs to another user
    existing_username = db.query(User).filter(
        func.lower(User.username) == username.lower(),
        User.id != user_id
    ).first()

    if existing_username:
        raise HTTPException(
            status_code=400,
            detail="Username already exists"
        )

    # Check email belongs to another user
    existing_email = db.query(User).filter(
        func.lower(User.email) == email,
        User.id != user_id
    ).first()

    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="Email is already registered"
        )

    db_user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not db_user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    db_user.username = username
    db_user.email = email

    try:
        db.commit()

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Username or email already exists"
        )

    db.refresh(db_user)

    return {
        "message": "Profile updated successfully",
        "user_id": db_user.id,
        "username": db_user.username,
        "email": db_user.email,
        "role": db_user.role
    }