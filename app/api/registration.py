from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel

from app.database import get_db


router = APIRouter(
    prefix="/registrations",
    tags=["Registrations"]
)


class RegistrationCreate(BaseModel):
    tournament_id: int
    team_id: int


# REGISTER TEAM
@router.post("/")
def register_team(
    registration: RegistrationCreate,
    db: Session = Depends(get_db)
):
    query = text("""
        insert into registrations (tournament_id, team_id, status)
        values (:tournament_id, :team_id, 'pending')
        returning id, tournament_id, team_id, status;
    """)

    result = db.execute(
        query,
        {
            "tournament_id": registration.tournament_id,
            "team_id": registration.team_id
        }
    )

    db.commit()

    row = result.fetchone()

    return dict(row._mapping)


# VIEW REGISTERED TEAMS
@router.get("/")
def get_registrations(
    db: Session = Depends(get_db)
):
    query = text("""
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
        order by r.id;
    """)

    result = db.execute(query)

    return [dict(row._mapping) for row in result]


# APPROVE REGISTRATION
@router.put("/{registration_id}/approve")
def approve_registration(
    registration_id: int,
    db: Session = Depends(get_db)
):
    query = text("""
        update registrations
        set status = 'approved'
        where id = :registration_id
        returning id, tournament_id, team_id, status;
    """)

    result = db.execute(
        query,
        {
            "registration_id": registration_id
        }
    )

    db.commit()

    row = result.fetchone()

    if not row:
        return {
            "message": "Registration not found"
        }

    return {
        "message": "Registration approved successfully",
        **dict(row._mapping)
    }