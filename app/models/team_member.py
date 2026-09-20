from sqlalchemy import Column, ForeignKey, Integer, UniqueConstraint

from app.database import Base


class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    team_id = Column(
        Integer,
        ForeignKey("teams.id"),
        nullable=False
    )

    player_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    __table_args__ = (
        UniqueConstraint(
            "team_id",
            "player_id",
            name="uq_team_member"
        ),
    )