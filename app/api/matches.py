from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db

router = APIRouter(
    prefix="/matches",
    tags=["Matches"]
)


class MatchCreate(BaseModel):
    tournament_id: int
    team1_id: int
    team2_id: int
    match_date: datetime


class MatchResult(BaseModel):
    winner_id: int
    result: str


# =========================
# VIEW MATCHES
# =========================

@router.get("/")
def get_matches(
    db: Session = Depends(get_db)
):
    query = text("""
        select
            m.id,
            t.name as tournament_name,
            t.game,
            team1.name as team1_name,
            team2.name as team2_name,
            m.match_date,
            m.result,
            winner.name as winner_name
        from matches m
        join tournaments t
            on m.tournament_id = t.id
        join teams team1
            on m.team1_id = team1.id
        join teams team2
            on m.team2_id = team2.id
        left join teams winner
            on m.winner_id = winner.id
        order by m.match_date;
    """)

    result = db.execute(query)

    return [
        dict(row._mapping)
        for row in result
    ]


# =========================
# SCHEDULE MATCH
# =========================

@router.post("/")
def schedule_match(
    match: MatchCreate,
    db: Session = Depends(get_db)
):
    if match.team1_id == match.team2_id:
        return {
            "message": "A team cannot play against itself"
        }

    query = text("""
        insert into matches (
            tournament_id,
            team1_id,
            team2_id,
            match_date
        )
        values (
            :tournament_id,
            :team1_id,
            :team2_id,
            :match_date
        )
        returning
            id,
            tournament_id,
            team1_id,
            team2_id,
            match_date;
    """)

    result = db.execute(
        query,
        {
            "tournament_id": match.tournament_id,
            "team1_id": match.team1_id,
            "team2_id": match.team2_id,
            "match_date": match.match_date
        }
    )

    db.commit()

    row = result.fetchone()

    return {
        "message": "Match scheduled successfully",
        **dict(row._mapping)
    }


# =========================
# ENTER MATCH RESULT
# =========================

@router.put("/{match_id}/result")
def enter_match_result(
    match_id: int,
    match_result: MatchResult,
    db: Session = Depends(get_db)
):

    # Check match exists
    check_query = text("""
        select
            id,
            team1_id,
            team2_id
        from matches
        where id = :match_id;
    """)

    match = db.execute(
        check_query,
        {
            "match_id": match_id
        }
    ).fetchone()

    if not match:
        return {
            "message": "Match not found"
        }

    # Check winner is one of the two teams
    if match_result.winner_id not in [
        match.team1_id,
        match.team2_id
    ]:
        return {
            "message": "Winner must be one of the teams in this match"
        }

    # Update result
    update_query = text("""
        update matches
        set
            winner_id = :winner_id,
            result = :result
        where id = :match_id
        returning
            id,
            tournament_id,
            team1_id,
            team2_id,
            winner_id,
            result;
    """)

    result = db.execute(
        update_query,
        {
            "match_id": match_id,
            "winner_id": match_result.winner_id,
            "result": match_result.result
        }
    )

    db.commit()

    row = result.fetchone()

    return {
        "message": "Match result updated successfully",
        **dict(row._mapping)
    }