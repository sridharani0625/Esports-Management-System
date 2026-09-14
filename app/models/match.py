from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from app.database import Base


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id"), nullable=False)
    team1_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    team2_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    winner_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    match_date = Column(DateTime, nullable=True)
    result = Column(String(50), nullable=True)