from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import get_current_user, organizer_required, player_required
from app.database import get_db


router = APIRouter(prefix="/applications", tags=["Player Applications"])


class ApplicationCreate(BaseModel):
    tournament_id: int


@router.post("/")
def apply_to_tournament(
    application: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user=Depends(player_required),
):
    tournament = db.execute(
        text("SELECT id, status FROM tournaments WHERE id = :tournament_id"),
        {"tournament_id": application.tournament_id},
    ).first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    if str(tournament.status).lower() != "upcoming":
        raise HTTPException(status_code=400, detail="Applications are only open for upcoming tournaments")

    result = db.execute(
        text("""
            INSERT INTO player_registrations (tournament_id, player_id, status)
            VALUES (:tournament_id, :player_id, 'pending')
            RETURNING id, tournament_id, player_id, status
        """),
        {
            "tournament_id": application.tournament_id,
            "player_id": current_user["user_id"],
        },
    )
    row = result.fetchone()
    result.close()
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="You have already applied to this tournament") from exc

    return {"message": "Application submitted successfully", **dict(row._mapping)}


@router.get("/")
def get_applications(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    role = current_user["role"]
    if role == "PLAYER":
        where_clause = "pr.player_id = :user_id"
    elif role == "ORGANIZER":
        where_clause = "t.organizer_id = :user_id"
    else:
        raise HTTPException(status_code=403, detail="Application access denied")

    result = db.execute(
        text(f"""
            SELECT
                pr.id,
                pr.tournament_id,
                t.name AS tournament_name,
                t.game,
                pr.player_id,
                u.username AS player_username,
                u.email AS player_email,
                pr.status,
                pr.created_at
            FROM player_registrations pr
            JOIN tournaments t ON t.id = pr.tournament_id
            JOIN users u ON u.id = pr.player_id
            WHERE {where_clause}
            ORDER BY pr.created_at DESC, pr.id DESC
        """),
        {"user_id": current_user["user_id"]},
    )
    rows = result.fetchall()
    result.close()
    return [dict(row._mapping) for row in rows]


def _change_application_status(
    application_id: int,
    status: str,
    db: Session,
    current_user: dict,
):
    application = db.execute(
        text("""
            SELECT pr.id, pr.status, t.organizer_id
            FROM player_registrations pr
            JOIN tournaments t ON t.id = pr.tournament_id
            WHERE pr.id = :application_id
        """),
        {"application_id": application_id},
    ).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    if application.organizer_id != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Only the tournament organizer can manage this application")
    if application.status != "pending":
        raise HTTPException(status_code=400, detail="Only pending applications can be updated")

    result = db.execute(
        text("""
            UPDATE player_registrations
            SET status = :status
            WHERE id = :application_id
            RETURNING id, tournament_id, player_id, status
        """),
        {"status": status, "application_id": application_id},
    )
    row = result.fetchone()
    result.close()
    db.commit()
    return {"message": f"Application {status} successfully", **dict(row._mapping)}


@router.put("/{application_id}/approve")
def approve_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(organizer_required),
):
    return _change_application_status(application_id, "approved", db, current_user)


@router.put("/{application_id}/reject")
def reject_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(organizer_required),
):
    return _change_application_status(application_id, "rejected", db, current_user)
