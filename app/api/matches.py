from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from datetime import datetime, timezone
import re

from app.database import get_db
from app.core.security import organizer_required

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


def update_leaderboard(db: Session, tournament_id: int, winner_id: int, loser_id: int) -> None:
    for team_id in (winner_id, loser_id):
        row = db.execute(
            text("""
                select id
                from leaderboard
                where tournament_id = :tournament_id
                  and team_id = :team_id
            """),
            {"tournament_id": tournament_id, "team_id": team_id},
        ).first()
        if row is None:
            db.execute(
                text("""
                    insert into leaderboard (
                        tournament_id, team_id, rank, points, wins, losses
                    )
                    values (:tournament_id, :team_id, 1, 0, 0, 0)
                """),
                {"tournament_id": tournament_id, "team_id": team_id},
            )

    db.execute(
        text("""
            update leaderboard
            set wins = wins + 1,
                points = points + 3
            where tournament_id = :tournament_id
              and team_id = :winner_id
        """),
        {"tournament_id": tournament_id, "winner_id": winner_id},
    )
    db.execute(
        text("""
            update leaderboard
            set losses = losses + 1
            where tournament_id = :tournament_id
              and team_id = :loser_id
        """),
        {"tournament_id": tournament_id, "loser_id": loser_id},
    )

    rows = db.execute(
        text("""
            select id
            from leaderboard
            where tournament_id = :tournament_id
            order by points desc, wins desc, id
        """),
        {"tournament_id": tournament_id},
    ).fetchall()
    for rank, row in enumerate(rows, start=1):
        db.execute(
            text("""
                update leaderboard
                set rank = :rank
                where id = :id
            """),
            {"rank": rank, "id": row.id},
        )


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
            m.team1_id,
            m.team2_id,
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
    rows = result.fetchall()
    result.close()

    matches = []
    now = datetime.now(timezone.utc)
    for row in rows:
        match = dict(row._mapping)
        match_date = match.get("match_date")
        if match.get("result"):
            match["status"] = "completed"
        elif match_date and (
            match_date.replace(tzinfo=timezone.utc)
            if match_date.tzinfo is None
            else match_date
        ) <= now:
            match["status"] = "running"
        else:
            match["status"] = "upcoming"
        matches.append(match)

    return matches


# =========================
# SCHEDULE MATCH
# =========================

@router.post("/")
def schedule_match(
    match: MatchCreate,
    db: Session = Depends(get_db),
    organizer=Depends(organizer_required),
):
    if match.team1_id == match.team2_id:
        raise HTTPException(
            status_code=400,
            detail="A team cannot play against itself",
        )

    tournament = db.execute(
        text("""
            select id
            from tournaments
            where id = :tournament_id
              and organizer_id = :organizer_id
        """),
        {
            "tournament_id": match.tournament_id,
            "organizer_id": organizer["user_id"],
        },
    ).first()
    if tournament is None:
        raise HTTPException(
            status_code=403,
            detail="You can only schedule matches for your own tournaments",
        )

    teams = db.execute(
        text("""
            select id
            from teams
            where id in (:team1_id, :team2_id)
        """),
        {"team1_id": match.team1_id, "team2_id": match.team2_id},
    ).fetchall()
    if len(teams) != 2:
        raise HTTPException(status_code=404, detail="One or both teams were not found")

    approved_count = db.execute(
        text("""
            select count(*) as count
            from registrations
            where tournament_id = :tournament_id
              and team_id in (:team1_id, :team2_id)
              and status = 'approved'
        """),
        {
            "tournament_id": match.tournament_id,
            "team1_id": match.team1_id,
            "team2_id": match.team2_id,
        },
    ).scalar()
    if approved_count != 2:
        raise HTTPException(
            status_code=400,
            detail="Both teams must have approved registrations for this tournament",
        )

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

    row = result.fetchone()
    result.close()
    db.commit()

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
    db: Session = Depends(get_db),
    organizer=Depends(organizer_required),
):

    # Check match exists
    check_query = text("""
        select
            id,
            tournament_id,
            team1_id,
            team2_id
        from matches
        where id = :match_id
          and tournament_id in (
              select id
              from tournaments
              where organizer_id = :organizer_id
          );
    """)

    match = db.execute(
        check_query,
        {
            "match_id": match_id,
            "organizer_id": organizer["user_id"],
        }
    ).first()

    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    # Check winner is one of the two teams
    if match_result.winner_id not in [
        match.team1_id,
        match.team2_id
    ]:
        raise HTTPException(
            status_code=400,
            detail="Winner must be one of the teams in this match",
        )

    if re.fullmatch(r"\d+-\d+", match_result.result.strip()) is None:
        raise HTTPException(
            status_code=400,
            detail="Result must use a score format such as 2-1",
        )

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

    row = result.fetchone()
    result.close()
    loser_id = (
        match.team2_id
        if match_result.winner_id == match.team1_id
        else match.team1_id
    )
    update_leaderboard(
        db,
        match.tournament_id,
        match_result.winner_id,
        loser_id,
    )
    db.commit()

    return {
        "message": "Match result updated successfully",
        **dict(row._mapping)
    }