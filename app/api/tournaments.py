from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.tournament import Tournament
from app.schemas.tournament import TournamentCreate, TournamentResponse
from app.core.security import organizer_required

router = APIRouter(prefix="/tournaments", tags=["Tournaments"])

@router.post("/", response_model=TournamentResponse)
def create_tournament(
    tournament: TournamentCreate,
    db: Session = Depends(get_db),
    organizer=Depends(organizer_required)
):
    if tournament.organizer_id != organizer.get("user_id"):
        raise HTTPException(
            status_code=403,
            detail="You can only create tournaments for your own organizer account"
        )

    new_tournament = Tournament(
        name=tournament.name,
        game=tournament.game,
        description=tournament.description,
        organizer_id=tournament.organizer_id
    )

    db.add(new_tournament)
    db.commit()
    db.refresh(new_tournament)

    return new_tournament


@router.get("/", response_model=list[TournamentResponse])
def get_tournaments(db: Session = Depends(get_db)):
    tournaments = db.query(Tournament).all()
    return tournaments