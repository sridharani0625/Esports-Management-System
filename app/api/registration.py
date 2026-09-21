from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel
from app.database import get_db
from app.core.security import (
    get_current_user,
    organizer_required,
    team_manager_required,
)

router = APIRouter(
    prefix="/registrations",
    tags=["Registrations"]
)

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
    ).first()

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
    ).first()

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
    ).first()

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

    row = result.fetchone()
    result.close()

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="This team is already registered for this tournament",
        ) from exc

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

    role = current_user.get("role")
    user_id = current_user.get("user_id")
    scope_clause = ""
    scope_params = {}

    if role == "ORGANIZER":
        scope_clause = "where t.organizer_id = :user_id"
        scope_params["user_id"] = user_id
    elif role == "TEAM_MANAGER":
        scope_clause = "where tm.manager_id = :user_id"
        scope_params["user_id"] = user_id
    elif role == "PLAYER":
        scope_clause = """
            where exists (
                select 1
                from team_members player_membership
                where player_membership.team_id = r.team_id
                  and player_membership.player_id = :user_id
            )
        """
        scope_params["user_id"] = user_id
    elif role != "ADMIN":
        raise HTTPException(status_code=403, detail="Registration access denied")

    result = db.execute(
        text(f"""
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
            {scope_clause}
            order by r.id
        """),
        scope_params,
    )

    rows = result.fetchall()
    result.close()

    return [
        dict(row._mapping)
        for row in rows
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
    ).first()

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

    if registration.status != "pending":
        raise HTTPException(
            status_code=400,
            detail="Only pending registrations can be approved"
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

    row = result.fetchone()
    result.close()
    db.commit()

    return {
        "message": "Registration approved successfully",
        **dict(row._mapping)
    }


@router.put("/{registration_id}/reject")
def reject_registration(
    registration_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(organizer_required),
):
    registration = db.execute(
        text("""
            select
                r.id,
                r.status,
                t.organizer_id
            from registrations r
            join tournaments t
                on r.tournament_id = t.id
            where r.id = :registration_id
        """),
        {"registration_id": registration_id},
    ).first()

    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")

    if registration.organizer_id != current_user.get("user_id"):
        raise HTTPException(
            status_code=403,
            detail="Only the tournament organizer can reject this registration",
        )

    if registration.status != "pending":
        raise HTTPException(
            status_code=400,
            detail="Only pending registrations can be rejected",
        )

    result = db.execute(
        text("""
            update registrations
            set status = 'rejected'
            where id = :registration_id
            returning id, tournament_id, team_id, status
        """),
        {"registration_id": registration_id},
    )
    row = result.fetchone()
    result.close()
    db.commit()

    return {
        "message": "Registration rejected successfully",
        **dict(row._mapping),
    }
