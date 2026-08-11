from sqlalchemy import Column, Integer, String, Text, ForeignKey
from app.database import Base


class Tournament(Base):
    __tablename__ = "tournaments"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=False)

    game = Column(String, nullable=False)

    description = Column(Text)

    organizer_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    status = Column(String, default="upcoming")