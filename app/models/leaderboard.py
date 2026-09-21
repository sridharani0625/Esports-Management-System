from sqlalchemy import CheckConstraint, Column, DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.sql import func

from app.database import Base


class Leaderboard(Base):
    __tablename__ = "leaderboard"

    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id"), nullable=False, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False, index=True)
    rank = Column(Integer, nullable=False)
    points = Column(Integer, nullable=False, default=0, server_default="0")
    wins = Column(Integer, nullable=False, default=0, server_default="0")
    losses = Column(Integer, nullable=False, default=0, server_default="0")
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("tournament_id", "team_id", name="uq_leaderboard_tournament_team"),
        CheckConstraint("rank > 0", name="ck_leaderboard_rank_positive"),
        CheckConstraint("points >= 0", name="ck_leaderboard_points_nonnegative"),
        CheckConstraint("wins >= 0", name="ck_leaderboard_wins_nonnegative"),
        CheckConstraint("losses >= 0", name="ck_leaderboard_losses_nonnegative"),
    )
