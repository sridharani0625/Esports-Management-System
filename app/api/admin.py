from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.core.security import admin_required

router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
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