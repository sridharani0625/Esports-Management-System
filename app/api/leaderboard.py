from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db

router = APIRouter(
    prefix="/leaderboard",
    tags=["Leaderboard"]
)


@router.get("/")
def get_leaderboard(db: Session = Depends(get_db)):
    query = text("""
        select
            l.rank,
            t.name as team_name,
            l.points,
            l.wins,
            l.losses
        from leaderboard l
        join teams t
            on l.team_id = t.id
        order by l.rank;
    """)

    result = db.execute(query)

    return [dict(row._mapping) for row in result]