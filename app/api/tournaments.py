import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import jwt

from app.database import get_db
from app.models.tournament import Tournament
from app.schemas.tournament import TournamentCreate, TournamentResponse

router = APIRouter(prefix="/tournaments", tags=["Tournaments"])

SECRET_KEY = os.getenv("JWT_SECRET_KEY")

security = HTTPBearer()


def organizer_required(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=["HS256"]
        )

        if payload.get("role") != "ORGANIZER":
            raise HTTPException(
                status_code=403,
                detail="Organizer access required"
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