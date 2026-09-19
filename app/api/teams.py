from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from sqlalchemy import text, func
import jwt

from app.database import get_db
from app.models.team import Team

router = APIRouter(
    prefix="/teams",
    tags=["Teams"]
)

SECRET_KEY = "my-secret-key"


class TeamCreate(BaseModel):
    name: str
    manager_id: int


class TeamMemberCreate(BaseModel):
    player_id: int


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


def player_required(user=Depends(get_current_user)):
    if user.get("role") != "PLAYER":
        raise HTTPException(
            status_code=403,
            detail="Player access required"
        )
    return user


@router.post("/")
def create_team(
    team: TeamCreate,
    db: Session = Depends(get_db),
    current_user=Depends(player_required)
):
    if team.manager_id != current_user.get("user_id"):
        raise HTTPException(
            status_code=403,
            detail="You can only create a team for your own account"
        )

    # Check whether the team name already exists
    existing_team = db.query(Team).filter(
        Team.name == team.name
    ).first()

    if existing_team:
        raise HTTPException(
            status_code=400,
            detail="Team name already exists. Please choose another name."
        )

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


@router.post("/{team_id}/members")
def add_team_member(
    team_id: int,
    member: TeamMemberCreate,
    db: Session = Depends(get_db),
    current_user=Depends(player_required)
):
    team = db.query(Team).filter(
        Team.id == team_id
    ).first()

    if not team:
        raise HTTPException(
            status_code=404,
            detail="Team not found"
        )

    if team.manager_id != current_user.get("user_id"):
        raise HTTPException(
            status_code=403,
            detail="Only the team manager can add members"
        )

    player = db.execute(
        text("""
            select id
            from users
            where id = :player_id
            and role = 'PLAYER'
        """),
        {"player_id": member.player_id}
    ).fetchone()

    if not player:
        raise HTTPException(
            status_code=404,
            detail="Player not found"
        )

    existing = db.execute(
        text("""
            select id
            from team_members
            where team_id = :team_id
            and player_id = :player_id
        """),
        {
            "team_id": team_id,
            "player_id": member.player_id
        }
    ).fetchone()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Player is already a member of this team"
        )

    result = db.execute(
        text("""
            insert into team_members (
                team_id,
                player_id
            )
            values (
                :team_id,
                :player_id
            )
            returning id, team_id, player_id
        """),
        {
            "team_id": team_id,
            "player_id": member.player_id
        }
    )

    db.commit()

    row = result.fetchone()

    return {
        "message": "Player added to team successfully",
        **dict(row._mapping)
    }


@router.get("/{team_id}/members")
def get_team_members(
    team_id: int,
    db: Session = Depends(get_db)
):
    team = db.query(Team).filter(
        Team.id == team_id
    ).first()

    if not team:
        raise HTTPException(
            status_code=404,
            detail="Team not found"
        )

    result = db.execute(
        text("""
            select
                tm.id,
                tm.team_id,
                u.id as player_id,
                u.username,
                u.email
            from team_members tm
            join users u
                on tm.player_id = u.id
            where tm.team_id = :team_id
            order by u.username
        """),
        {"team_id": team_id}
    )

    return [
        dict(row._mapping)
        for row in result
    ]