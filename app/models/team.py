from sqlalchemy import Column, Integer, String, ForeignKey
from app.database import Base


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=False)