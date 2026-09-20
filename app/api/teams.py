from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel
from sqlalchemy import text, func
from sqlalchemy.exc import IntegrityError
import jwt
from passlib.context import CryptContext
import re

from app.database import get_db
from app.models.team import Team
from app.models.user import User


router = APIRouter(
    prefix="/teams",
    tags=["Teams"]
)

SECRET_KEY = "my-secret-key"

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


# =========================
# JWT AUTHENTICATION
# =========================

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials

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
# TEAM MANAGER AUTHORIZATION
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
    db.commit()
    db.refresh(new_team)

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

    # ---------------------------------
    # Check team exists
    # ---------------------------------

    team = db.query(Team).filter(
        Team.id == team_id
    ).first()

    if not team:
        raise HTTPException(
            status_code=404,
            detail="Team not found"
        )

    # ---------------------------------
    # Only the team owner can create
    # players for that team
    # ---------------------------------

    if team.manager_id != current_user.get("user_id"):
        raise HTTPException(
            status_code=403,
            detail="Only the team manager can create players for this team"
        )

    # ---------------------------------
    # Clean input
    # ---------------------------------

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

    # ---------------------------------
    # Check username
    # ---------------------------------

    existing_username = db.query(User).filter(
        func.lower(User.username) == username.lower()
    ).first()

    if existing_username:
        raise HTTPException(
            status_code=400,
            detail="Username already exists. Please choose another username."
        )

    # ---------------------------------
    # Check email
    # ---------------------------------

    existing_email = db.query(User).filter(
        func.lower(User.email) == email
    ).first()

    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="Email is already registered. Please use another email."
        )

    # ---------------------------------
    # Create PLAYER account
    # ---------------------------------

    new_player = User(
        username=username,
        email=email,
        password=pwd_context.hash(player.password),
        role="PLAYER"
    )

    db.add(new_player)

    try:
        db.flush()

        # ---------------------------------
        # Automatically add player to team
        # ---------------------------------

        db.execute(
            text("""
                insert into team_members (
                    team_id,
                    player_id
                )
                values (
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

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Could not create player account"
        )

    db.refresh(new_player)

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
        {
            "player_id": member.player_id
        }
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
        {
            "team_id": team_id
        }
    )

    return [
        dict(row._mapping)
        for row in result
    ]