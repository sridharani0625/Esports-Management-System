import os
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy import text
import jwt

from app.database import get_db

router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)

SECRET_KEY = os.getenv("JWT_SECRET_KEY")


def admin_required(authorization: str = Header(None)):

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
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=["HS256"]
        )

        if payload.get("role") != "ADMIN":
            raise HTTPException(
                status_code=403,
                detail="Admin access required"
            )

        return payload

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


@router.get("/users")
def get_all_users(
    db: Session = Depends(get_db),
    admin=Depends(admin_required)
):

    result = db.execute(text("""
        select
            id,
            username,
            email,
            role
        from users
        order by id;
    """))

    return [
        dict(row._mapping)
        for row in result
    ]


@router.get("/audit-logs")
def get_audit_logs(
    db: Session = Depends(get_db),
    admin=Depends(admin_required)
):

    result = db.execute(text("""
        select
            a.id,
            a.user_id,
            u.username,
            a.action,
            a.description,
            a.created_at
        from audit_logs a
        join users u
            on a.user_id = u.id
        order by a.created_at desc;
    """))

    return [
        dict(row._mapping)
        for row in result
    ]


@router.get("/stats")
def get_admin_stats(
    db: Session = Depends(get_db),
    admin=Depends(admin_required)
):

    users = db.execute(text("""
        select count(*) from users;
    """)).scalar()

    players = db.execute(text("""
        select count(*) from users
        where role = 'PLAYER';
    """)).scalar()

    organizers = db.execute(text("""
        select count(*) from users
        where role = 'ORGANIZER';
    """)).scalar()

    admins = db.execute(text("""
        select count(*) from users
        where role = 'ADMIN';
    """)).scalar()

    tournaments = db.execute(text("""
        select count(*) from tournaments;
    """)).scalar()

    teams = db.execute(text("""
        select count(*) from teams;
    """)).scalar()

    matches = db.execute(text("""
        select count(*) from matches;
    """)).scalar()

    return {
        "total_users": users,
        "players": players,
        "organizers": organizers,
        "admins": admins,
        "tournaments": tournaments,
        "teams": teams,
        "matches": matches
    }