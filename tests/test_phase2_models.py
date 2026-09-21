import os

os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")

import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models.audit_log import AuditLog
from app.models.leaderboard import Leaderboard
from app.models.registration import Registration
from app.models.team import Team
from app.models.tournament import Tournament
from app.models.user import User


@pytest.fixture()
def db_session():
    engine = create_engine("sqlite:///:memory:")

    @event.listens_for(engine, "connect")
    def enable_foreign_keys(dbapi_connection, connection_record):
        dbapi_connection.execute("PRAGMA foreign_keys=ON")

    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(engine)


@pytest.fixture()
def tournament_context(db_session):
    organizer = User(username="organizer", email="organizer@example.com", password="hash", role="ORGANIZER")
    manager = User(username="manager", email="manager@example.com", password="hash", role="TEAM_MANAGER")
    db_session.add_all([organizer, manager])
    db_session.flush()

    tournament = Tournament(name="Cup", game="Game", organizer_id=organizer.id)
    team = Team(name="Team One", manager_id=manager.id)
    db_session.add_all([tournament, team])
    db_session.commit()
    return organizer, manager, tournament, team


def test_registration_has_unique_tournament_team(db_session, tournament_context):
    _, _, tournament, team = tournament_context
    db_session.add(Registration(tournament_id=tournament.id, team_id=team.id, status="pending"))
    db_session.commit()
    db_session.add(Registration(tournament_id=tournament.id, team_id=team.id, status="pending"))

    with pytest.raises(IntegrityError):
        db_session.commit()


@pytest.mark.parametrize("status", ["pending", "approved", "rejected"])
def test_registration_accepts_valid_statuses(db_session, tournament_context, status):
    _, _, tournament, team = tournament_context
    db_session.add(Registration(tournament_id=tournament.id, team_id=team.id, status=status))
    db_session.commit()

    assert db_session.query(Registration).one().status == status


def test_registration_rejects_invalid_status(db_session, tournament_context):
    _, _, tournament, team = tournament_context
    db_session.add(Registration(tournament_id=tournament.id, team_id=team.id, status="invalid"))

    with pytest.raises(IntegrityError):
        db_session.commit()


def test_leaderboard_is_unique_per_tournament_and_team(db_session, tournament_context):
    organizer, _, tournament, team = tournament_context
    other_tournament = Tournament(name="Cup Two", game="Game", organizer_id=organizer.id)
    db_session.add(other_tournament)
    db_session.flush()
    db_session.add_all([
        Leaderboard(tournament_id=tournament.id, team_id=team.id, rank=1),
        Leaderboard(tournament_id=other_tournament.id, team_id=team.id, rank=1),
    ])
    db_session.commit()
    db_session.add(Leaderboard(tournament_id=tournament.id, team_id=team.id, rank=1))

    with pytest.raises(IntegrityError):
        db_session.commit()


def test_foreign_keys_connect_phase2_tables(db_session, tournament_context):
    organizer, _, tournament, team = tournament_context
    registration = Registration(tournament_id=tournament.id, team_id=team.id, status="approved")
    leaderboard = Leaderboard(tournament_id=tournament.id, team_id=team.id, rank=1)
    audit_log = AuditLog(user_id=organizer.id, action="test", description="created")
    db_session.add_all([registration, leaderboard, audit_log])
    db_session.commit()

    assert registration.tournament_id == tournament.id
    assert leaderboard.team_id == team.id
    assert audit_log.user_id == organizer.id


def test_foreign_keys_reject_unknown_references(db_session):
    db_session.add(Registration(tournament_id=999, team_id=999, status="pending"))

    with pytest.raises(IntegrityError):
        db_session.commit()


def test_audit_log_creation(db_session, tournament_context):
    organizer, _, _, _ = tournament_context
    log = AuditLog(
        user_id=organizer.id,
        action="TOURNAMENT_CREATED",
        description="Tournament created",
    )
    db_session.add(log)
    db_session.commit()

    saved = db_session.query(AuditLog).one()
    assert saved.id is not None
    assert saved.created_at is not None
