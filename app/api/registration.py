from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
import jwt

from app.database import get_db

router = APIRouter(
    prefix="/registrations",
    tags=["Registrations"]
)

SECRET_KEY = "my-secret-key"


# =========================
# JWT AUTHENTICATION
# =========================

def get_current_user(
    authorization: str = Header(None)
):

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
# ROLE CHECKS
# =========================

def team_manager_required(
    user=Depends(get_current_user)
):

    if user.get("role") != "TEAM_MANAGER":
        raise HTTPException(
            status_code=403,
            detail="Team manager access required"
        )

    return user


def organizer_required(
    user=Depends(get_current_user)
):

    if user.get("role") != "ORGANIZER":
        raise HTTPException(
            status_code=403,
            detail="Organizer access required"
        )

    return user


# =========================
# SCHEMA
# =========================

class RegistrationCreate(BaseModel):
    tournament_id: int
    team_id: int


# =========================
# REGISTER TEAM
# =========================

@router.post("/")
def register_team(
    registration: RegistrationCreate,
    db: Session = Depends(get_db),
    current_user=Depends(team_manager_required)
):

    team = db.execute(
        text("""
            select
                id,
                manager_id
            from teams
            where id = :team_id
        """),
        {
            "team_id": registration.team_id
        }
    ).fetchone()

    if not team:
        raise HTTPException(
            status_code=404,
            detail="Team not found"
        )

    if team.manager_id != current_user.get("user_id"):
        raise HTTPException(
            status_code=403,
            detail="Only the team manager can register this team"
        )

    tournament = db.execute(
        text("""
            select
                id
            from tournaments
            where id = :tournament_id
        """),
        {
            "tournament_id": registration.tournament_id
        }
    ).fetchone()

    if not tournament:
        raise HTTPException(
            status_code=404,
            detail="Tournament not found"
        )

    existing = db.execute(
        text("""
            select
                id
            from registrations
            where tournament_id = :tournament_id
            and team_id = :team_id
        """),
        {
            "tournament_id": registration.tournament_id,
            "team_id": registration.team_id
        }
    ).fetchone()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="This team is already registered for this tournament"
        )

    result = db.execute(
        text("""
            insert into registrations (
                tournament_id,
                team_id,
                status
            )
            values (
                :tournament_id,
                :team_id,
                'pending'
            )
            returning
                id,
                tournament_id,
                team_id,
                status
        """),
        {
            "tournament_id": registration.tournament_id,
            "team_id": registration.team_id
        }
    )

    db.commit()

    row = result.fetchone()

    return {
        "message": "Team registered successfully",
        **dict(row._mapping)
    }


# =========================
# VIEW REGISTRATIONS
# =========================

@router.get("/")
def get_registrations(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    result = db.execute(
        text("""
            select
                r.id,
                r.tournament_id,
                t.name as tournament_name,
                r.team_id,
                tm.name as team_name,
                r.status
            from registrations r
            join tournaments t
                on r.tournament_id = t.id
            join teams tm
                on r.team_id = tm.id
            order by r.id
        """)
    )

    return [
        dict(row._mapping)
        for row in result
    ]


# =========================
# APPROVE REGISTRATION
# =========================

@router.put("/{registration_id}/approve")
def approve_registration(
    registration_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(organizer_required)
):

    registration = db.execute(
        text("""
            select
                r.id,
                r.tournament_id,
                r.team_id,
                r.status,
                t.organizer_id
            from registrations r
            join tournaments t
                on r.tournament_id = t.id
            where r.id = :registration_id
        """),
        {
            "registration_id": registration_id
        }
    ).fetchone()

    if not registration:
        raise HTTPException(
            status_code=404,
            detail="Registration not found"
        )

    if registration.organizer_id != current_user.get("user_id"):
        raise HTTPException(
            status_code=403,
            detail="Only the tournament organizer can approve this registration"
        )

    if registration.status == "approved":
        raise HTTPException(
            status_code=400,
            detail="Registration is already approved"
        )

    result = db.execute(
        text("""
            update registrations
            set status = 'approved'
            where id = :registration_id
            returning
                id,
                tournament_id,
                team_id,
                status
        """),
        {
            "registration_id": registration_id
        }
    )

    db.commit()

    row = result.fetchone()

    return {
        "message": "Registration approved successfully",
        **dict(row._mapping)
    }