import os
from datetime import datetime, timedelta, timezone

os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("JWT_SECRET_KEY", "registration-test-secret")

import jwt
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.pool import NullPool
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app
from app.models.audit_log import AuditLog
from app.models.leaderboard import Leaderboard
from app.models.match import Match
from app.models.registration import Registration
from app.models.team import Team
from app.models.team_member import TeamMember
from app.models.tournament import Tournament
from app.models.user import User


@pytest.fixture()
def registration_client(registration_context):
    return registration_context["_client"], None


@pytest.fixture()
def registration_context(tmp_path):
    database_path = tmp_path / "registration.sqlite"
    engine = create_engine(
        f"sqlite:///{database_path}",
        connect_args={"check_same_thread": False},
        poolclass=NullPool,
    )

    @event.listens_for(engine, "connect")
    def enable_foreign_keys(dbapi_connection, connection_record):
        dbapi_connection.execute("PRAGMA foreign_keys=ON")

    Base.metadata.create_all(engine)
    session_factory = sessionmaker(bind=engine, expire_on_commit=False)
    db = session_factory()

    manager = User(
        username="manager",
        email="manager@example.com",
        password="hash",
        role="TEAM_MANAGER",
    )
    other_manager = User(
        username="other-manager",
        email="other-manager@example.com",
        password="hash",
        role="TEAM_MANAGER",
    )
    organizer = User(
        username="organizer",
        email="organizer@example.com",
        password="hash",
        role="ORGANIZER",
    )
    other_organizer = User(
        username="other-organizer",
        email="other-organizer@example.com",
        password="hash",
        role="ORGANIZER",
    )
    player = User(
        username="player",
        email="player@example.com",
        password="hash",
        role="PLAYER",
    )
    db.add_all([manager, other_manager, organizer, other_organizer, player])
    db.flush()

    team = Team(name="Team One", manager_id=manager.id)
    other_team = Team(name="Team Two", manager_id=other_manager.id)
    tournament = Tournament(
        name="Organizer Cup",
        game="Game",
        organizer_id=organizer.id,
    )
    other_tournament = Tournament(
        name="Other Cup",
        game="Game",
        organizer_id=other_organizer.id,
    )
    db.add_all([team, other_team, tournament, other_tournament])
    db.flush()
    db.add(TeamMember(team_id=team.id, player_id=player.id))
    db.commit()

    context = {
        "manager": manager,
        "other_manager": other_manager,
        "organizer": organizer,
        "other_organizer": other_organizer,
        "player": player,
        "team": team,
        "other_team": other_team,
        "tournament": tournament,
        "other_tournament": other_tournament,
    }
    db.close()

    def override_get_db():
        with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    try:
        with TestClient(app) as client:
            context["_client"] = client
            yield context
    finally:
        app.dependency_overrides.clear()
        Base.metadata.drop_all(engine)
        engine.dispose()


def auth_header(user):
    token = jwt.encode(
        {
            "user_id": user.id,
            "role": user.role,
            "exp": datetime.now(timezone.utc) + timedelta(minutes=5),
        },
        os.environ["JWT_SECRET_KEY"],
        algorithm="HS256",
    )
    return {"Authorization": f"Bearer {token}"}


def create_registration(client, context, user_key="manager", team_key="team", tournament_key="tournament"):
    return client.post(
        "/registrations/",
        headers=auth_header(context[user_key]),
        json={
            "team_id": context[team_key].id,
            "tournament_id": context[tournament_key].id,
        },
    )


def test_team_manager_can_register_own_team(registration_client, registration_context):
    client, _ = registration_client
    response = create_registration(client, registration_context)

    assert response.status_code == 200
    assert response.json()["status"] == "pending"


def test_team_manager_cannot_register_another_managers_team(registration_client, registration_context):
    client, _ = registration_client
    context = registration_context
    response = create_registration(
        client,
        context,
        team_key="other_team",
    )

    assert response.status_code == 403


def test_duplicate_registration_is_rejected(registration_client, registration_context):
    client, _ = registration_client
    context = registration_context
    assert create_registration(client, context).status_code == 200

    response = create_registration(client, context)

    assert response.status_code == 400


def test_organizer_sees_only_own_tournament_registrations(registration_client, registration_context):
    client, _ = registration_client
    context = registration_context
    create_registration(client, context)
    create_registration(
        client,
        context,
        team_key="other_team",
        tournament_key="other_tournament",
        user_key="other_manager",
    )

    response = client.get(
        "/registrations/",
        headers=auth_header(context["organizer"]),
    )

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["tournament_id"] == context["tournament"].id


def test_organizer_cannot_manage_another_organizers_registration(registration_client, registration_context):
    client, _ = registration_client
    context = registration_context
    create_registration(
        client,
        context,
        team_key="other_team",
        tournament_key="other_tournament",
        user_key="other_manager",
    )
    registration_id = client.get(
        "/registrations/",
        headers=auth_header(context["other_organizer"]),
    ).json()[0]["id"]

    response = client.put(
        f"/registrations/{registration_id}/approve",
        headers=auth_header(context["organizer"]),
    )

    assert response.status_code == 403


def test_organizer_can_approve_pending_registration(registration_client, registration_context):
    client, _ = registration_client
    context = registration_context
    create_registration(client, context)
    registration_id = client.get(
        "/registrations/",
        headers=auth_header(context["organizer"]),
    ).json()[0]["id"]

    response = client.put(
        f"/registrations/{registration_id}/approve",
        headers=auth_header(context["organizer"]),
    )

    assert response.status_code == 200
    assert response.json()["status"] == "approved"


def test_organizer_can_reject_pending_registration(registration_client, registration_context):
    client, _ = registration_client
    context = registration_context
    create_registration(client, context)
    registration_id = client.get(
        "/registrations/",
        headers=auth_header(context["organizer"]),
    ).json()[0]["id"]

    response = client.put(
        f"/registrations/{registration_id}/reject",
        headers=auth_header(context["organizer"]),
    )

    assert response.status_code == 200
    assert response.json()["status"] == "rejected"


def test_player_cannot_create_registration(registration_client, registration_context):
    client, _ = registration_client
    context = registration_context
    response = create_registration(client, context, user_key="player")

    assert response.status_code == 403


def test_player_cannot_approve_or_reject(registration_client, registration_context):
    client, _ = registration_client
    context = registration_context
    create_registration(client, context)
    registration_id = client.get(
        "/registrations/",
        headers=auth_header(context["organizer"]),
    ).json()[0]["id"]

    approve = client.put(
        f"/registrations/{registration_id}/approve",
        headers=auth_header(context["player"]),
    )
    reject = client.put(
        f"/registrations/{registration_id}/reject",
        headers=auth_header(context["player"]),
    )

    assert approve.status_code == 403
    assert reject.status_code == 403


def test_invalid_status_transition_is_rejected(registration_client, registration_context):
    client, _ = registration_client
    context = registration_context
    create_registration(client, context)
    registration_id = client.get(
        "/registrations/",
        headers=auth_header(context["organizer"]),
    ).json()[0]["id"]

    approve = client.put(
        f"/registrations/{registration_id}/approve",
        headers=auth_header(context["organizer"]),
    )
    reject = client.put(
        f"/registrations/{registration_id}/reject",
        headers=auth_header(context["organizer"]),
    )

    assert approve.status_code == 200
    assert reject.status_code == 400
