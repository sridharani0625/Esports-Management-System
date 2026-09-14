from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models.team import Team

router = APIRouter(
    prefix="/teams",
    tags=["Teams"]
)


class TeamCreate(BaseModel):
    name: str
    manager_id: int


@router.post("/")
def create_team(
    team: TeamCreate,
    db: Session = Depends(get_db)
):
    new_team = Team(
        name=team.name,
        manager_id=team.manager_id
    )

    db.add(new_team)
    db.commit()
    db.refresh(new_team)

    return {
        "message": "Team created successfully",
        "team_id": new_team.id,
        "name": new_team.name,
        "manager_id": new_team.manager_id
    }


@router.get("/")
def get_teams(db: Session = Depends(get_db)):
    return db.query(Team).all()