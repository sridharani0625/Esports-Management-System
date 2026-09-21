import re

from fastapi import APIRouter, Depends, HTTPException
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy import func, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.team import Team
from app.models.user import User
from app.core.security import team_manager_required


router = APIRouter(
    prefix="/teams",
    tags=["Teams"]
)

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


# =========================
# VALIDATION
# =========================

def validate_email(email: str):
    pattern = r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"

    if not re.match(pattern, email):
        raise HTTPException(
            status_code=400,
            detail="Please enter a valid email address"
        )


def validate_password(password: str):
    if len(password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least 8 characters"
        )

    if not re.search(r"[A-Z]", password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one uppercase letter"
        )

    if not re.search(r"[a-z]", password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one lowercase letter"
        )

    if not re.search(r"\d", password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one number"
        )

    if not re.search(r"[^A-Za-z0-9]", password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one special character"
        )


# =========================
# SCHEMAS
# =========================

class TeamCreate(BaseModel):
    name: str
    manager_id: int


class TeamMemberCreate(BaseModel):
    player_id: int


class PlayerCreate(BaseModel):
    username: str
    email: str
    password: str


# =========================
# CREATE TEAM
# =========================

@router.post("/")
def create_team(
    team: TeamCreate,
    db: Session = Depends(get_db),
    current_user=Depends(team_manager_required)
):
    if team.manager_id != current_user.get("user_id"):
        raise HTTPException(
            status_code=403,
            detail="You can only create a team for your own account"
        )

    team_name = team.name.strip()

    if not team_name:
        raise HTTPException(
            status_code=400,
            detail="Team name cannot be empty"
        )

    existing_team = db.query(Team).filter(
        func.lower(Team.name) == team_name.lower()
    ).first()

    if existing_team:
        raise HTTPException(
            status_code=400,
            detail="Team name already exists. Please choose another name."
        )

    new_team = Team(
        name=team_name,
        manager_id=team.manager_id
    )

    db.add(new_team)

    try:
        db.commit()
        db.refresh(new_team)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Could not create team"
        )

    return {
        "message": "Team created successfully",
        "team_id": new_team.id,
        "name": new_team.name,
        "manager_id": new_team.manager_id
    }


# =========================
# VIEW TEAMS
# =========================

@router.get("/")
def get_teams(
    db: Session = Depends(get_db)
):
    return db.query(Team).all()


# =====================================================
# TEAM MANAGER CREATES PLAYER ACCOUNT
# =====================================================

@router.post("/{team_id}/players")
def create_player_for_team(
    team_id: int,
    player: PlayerCreate,
    db: Session = Depends(get_db),
    current_user=Depends(team_manager_required)
):
    # Check team exists
    team = db.query(Team).filter(
        Team.id == team_id
    ).first()

    if not team:
        raise HTTPException(
            status_code=404,
            detail="Team not found"
        )

    # Only team manager can create players
    if team.manager_id != current_user.get("user_id"):
        raise HTTPException(
            status_code=403,
            detail="Only the team manager can create players for this team"
        )

    username = player.username.strip()
    email = player.email.strip().lower()

    if not username:
        raise HTTPException(
            status_code=400,
            detail="Username cannot be empty"
        )

    if len(username) < 3:
        raise HTTPException(
            status_code=400,
            detail="Username must contain at least 3 characters"
        )

    validate_email(email)
    validate_password(player.password)

    existing_username = db.query(User).filter(
        func.lower(User.username) == username.lower()
    ).first()

    if existing_username:
        raise HTTPException(
            status_code=400,
            detail="Username already exists. Please choose another username."
        )

    existing_email = db.query(User).filter(
        func.lower(User.email) == email
    ).first()

    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="Email is already registered. Please use another email."
        )

    new_player = User(
        username=username,
        email=email,
        password=pwd_context.hash(player.password),
        role="PLAYER"
    )

    db.add(new_player)

    try:
        db.flush()

        db.execute(
            text("""
                INSERT INTO team_members (
                    team_id,
                    player_id
                )
                VALUES (
                    :team_id,
                    :player_id
                )
            """),
            {
                "team_id": team_id,
                "player_id": new_player.id
            }
        )

        db.commit()
        db.refresh(new_player)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Could not create player account"
        )

    return {
        "message": "Player account created and added to team successfully",
        "player_id": new_player.id,
        "username": new_player.username,
        "email": new_player.email,
        "role": new_player.role,
        "team_id": team.id,
        "team_name": team.name
    }


# =========================
# ADD EXISTING PLAYER
# =========================

@router.post("/{team_id}/members")
def add_team_member(
    team_id: int,
    member: TeamMemberCreate,
    db: Session = Depends(get_db),
    current_user=Depends(team_manager_required)
):
    # Check team exists
    team = db.query(Team).filter(
        Team.id == team_id
    ).first()

    if not team:
        raise HTTPException(
            status_code=404,
            detail="Team not found"
        )

    # Only the manager of this team can add players
    if team.manager_id != current_user.get("user_id"):
        raise HTTPException(
            status_code=403,
            detail="Only the team manager can add members"
        )

    # Check that the selected user exists and is a PLAYER
    player = db.execute(
        text("""
            SELECT id
            FROM users
            WHERE id = :player_id
              AND role = 'PLAYER'
        """),
        {
            "player_id": member.player_id
        }
    ).fetchone()

    if not player:
        raise HTTPException(
            status_code=404,
            detail="Player not found"
        )

    # Check whether player is already in this team
    existing = db.execute(
        text("""
            SELECT id
            FROM team_members
            WHERE team_id = :team_id
              AND player_id = :player_id
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

    # Add player to team
    try:
        result = db.execute(
            text("""
                INSERT INTO team_members (
                    team_id,
                    player_id
                )
                VALUES (
                    :team_id,
                    :player_id
                )
                RETURNING id, team_id, player_id
            """),
            {
                "team_id": team_id,
                "player_id": member.player_id
            }
        )

        row = result.fetchone()

        db.commit()

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Could not add player to team"
        )

    return {
        "message": "Player added to team successfully",
        **dict(row._mapping)
    }


@router.delete("/{team_id}/members/{player_id}")
def remove_team_member(
    team_id: int,
    player_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(team_manager_required),
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if team.manager_id != current_user["user_id"]:
        raise HTTPException(
            status_code=403,
            detail="Only the team manager can remove members",
        )

    result = db.execute(
        text("""
            DELETE FROM team_members
            WHERE team_id = :team_id
              AND player_id = :player_id
            RETURNING id, team_id, player_id
        """),
        {"team_id": team_id, "player_id": player_id},
    )
    row = result.fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Team member not found")

    db.commit()
    return {
        "message": "Player removed from team successfully",
        **dict(row._mapping),
    }


# =========================
# VIEW TEAM MEMBERS
# =========================

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
            SELECT
                tm.id,
                tm.team_id,
                u.id AS player_id,
                u.username,
                u.email
            FROM team_members tm
            JOIN users u
                ON tm.player_id = u.id
            WHERE tm.team_id = :team_id
            ORDER BY u.username
        """),
        {
            "team_id": team_id
        }
    )

    return [
        dict(row._mapping)
        for row in result
    ]