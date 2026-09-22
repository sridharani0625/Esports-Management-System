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
from app.models.player_registration import PlayerRegistration
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
    player_two = User(
        username="player-two",
        email="player-two@example.com",
        password="TestPassword123!",
        role="PLAYER",
    )
    db.add_all([manager, other_manager, organizer, other_organizer, player, player_two])
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
        "player_two": player_two,
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


def approve_registration(client, context, team_key, manager_key):
    response = create_registration(
        client,
        context,
        user_key=manager_key,
        team_key=team_key,
    )
    registration_id = response.json()["id"]
    approved = client.put(
        f"/registrations/{registration_id}/approve",
        headers=auth_header(context["organizer"]),
    )
    assert approved.status_code == 200


def schedule_payload(context):
    return {
        "tournament_id": context["tournament"].id,
        "team1_id": context["team"].id,
        "team2_id": context["other_team"].id,
        "match_date": "2026-09-22T12:00:00",
    }


def test_organizer_jwt_required_for_scheduling(registration_client, registration_context):
    client, _ = registration_client
    response = client.post("/matches/", json=schedule_payload(registration_context))
    assert response.status_code == 401


def test_approved_teams_can_be_scheduled(registration_client, registration_context):
    client, _ = registration_client
    context = registration_context
    approve_registration(client, context, "team", "manager")
    approve_registration(client, context, "other_team", "other_manager")
    response = client.post(
        "/matches/",
        headers=auth_header(context["organizer"]),
        json=schedule_payload(context),
    )
    assert response.status_code == 200


def test_pending_team_cannot_be_scheduled(registration_client, registration_context):
    client, _ = registration_client
    context = registration_context
    approve_registration(client, context, "team", "manager")
    create_registration(client, context, user_key="other_manager", team_key="other_team")
    response = client.post(
        "/matches/",
        headers=auth_header(context["organizer"]),
        json=schedule_payload(context),
    )
    assert response.status_code == 400


def test_same_team_cannot_play_itself(registration_client, registration_context):
    client, _ = registration_client
    context = registration_context
    payload = schedule_payload(context)
    payload["team2_id"] = payload["team1_id"]
    response = client.post(
        "/matches/",
        headers=auth_header(context["organizer"]),
        json=payload,
    )
    assert response.status_code == 400


def test_organizer_jwt_required_for_result_update(registration_client, registration_context):
    client, _ = registration_client
    context = registration_context
    approve_registration(client, context, "team", "manager")
    approve_registration(client, context, "other_team", "other_manager")
    scheduled = client.post(
        "/matches/",
        headers=auth_header(context["organizer"]),
        json=schedule_payload(context),
    )
    match_id = scheduled.json()["id"]
    response = client.put(
        f"/matches/{match_id}/result",
        json={"winner_id": context["team"].id, "result": "2-1"},
    )
    assert response.status_code == 401


def test_invalid_winner_is_rejected(registration_client, registration_context):
    client, _ = registration_client
    context = registration_context
    approve_registration(client, context, "team", "manager")
    approve_registration(client, context, "other_team", "other_manager")
    scheduled = client.post(
        "/matches/",
        headers=auth_header(context["organizer"]),
        json=schedule_payload(context),
    )
    response = client.put(
        f"/matches/{scheduled.json()['id']}/result",
        headers=auth_header(context["organizer"]),
        json={"winner_id": context["organizer"].id, "result": "2-1"},
    )
    assert response.status_code == 400


def test_valid_result_updates_match_and_leaderboard(registration_client, registration_context):
    client, _ = registration_client
    context = registration_context
    approve_registration(client, context, "team", "manager")
    approve_registration(client, context, "other_team", "other_manager")
    scheduled = client.post(
        "/matches/",
        headers=auth_header(context["organizer"]),
        json=schedule_payload(context),
    )
    response = client.put(
        f"/matches/{scheduled.json()['id']}/result",
        headers=auth_header(context["organizer"]),
        json={"winner_id": context["team"].id, "result": "2-1"},
    )
    assert response.status_code == 200
    assert response.json()["result"] == "2-1"

    leaderboard = client.get("/leaderboard/")
    assert leaderboard.status_code == 200
    rows = {row["team_name"]: row for row in leaderboard.json()}
    assert rows["Team One"]["points"] == 3
    assert rows["Team One"]["wins"] == 1
    assert rows["Team Two"]["losses"] == 1


def test_player_can_apply_and_see_pending_application(registration_client, registration_context):
    client, _ = registration_client
    context = registration_context
    response = client.post(
        "/applications/",
        headers=auth_header(context["player"]),
        json={"tournament_id": context["tournament"].id},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "pending"

    applications = client.get(
        "/applications/",
        headers=auth_header(context["player"]),
    )
    assert applications.status_code == 200
    assert applications.json()[0]["player_id"] == context["player"].id


def test_organizer_can_approve_player_application(registration_client, registration_context):
    client, _ = registration_client
    context = registration_context
    created = client.post(
        "/applications/",
        headers=auth_header(context["player"]),
        json={"tournament_id": context["tournament"].id},
    )
    application_id = created.json()["id"]

    response = client.put(
        f"/applications/{application_id}/approve",
        headers=auth_header(context["organizer"]),
    )
    assert response.status_code == 200
    assert response.json()["status"] == "approved"


def test_player_application_is_scoped_to_tournament_organizer(registration_client, registration_context):
    client, _ = registration_client
    context = registration_context
    created = client.post(
        "/applications/",
        headers=auth_header(context["player"]),
        json={"tournament_id": context["tournament"].id},
    )
    application_id = created.json()["id"]

    response = client.put(
        f"/applications/{application_id}/approve",
        headers=auth_header(context["other_organizer"]),
    )
    assert response.status_code == 403


def apply_player(client, context, player_key):
    response = client.post(
        "/applications/",
        headers=auth_header(context[player_key]),
        json={"tournament_id": context["tournament"].id},
    )
    assert response.status_code == 200
    application_id = response.json()["id"]
    approved = client.put(
        f"/applications/{application_id}/approve",
        headers=auth_header(context["organizer"]),
    )
    assert approved.status_code == 200


def player_match_payload(context):
    return {
        "tournament_id": context["tournament"].id,
        "player1_id": context["player"].id,
        "player2_id": context["player_two"].id,
        "match_date": "2026-09-22T12:00:00",
    }


def test_approved_players_can_be_scheduled(registration_client, registration_context):
    client, _ = registration_client
    context = registration_context
    apply_player(client, context, "player")
    apply_player(client, context, "player_two")
    response = client.post(
        "/matches/",
        headers=auth_header(context["organizer"]),
        json=player_match_payload(context),
    )
    assert response.status_code == 200
    assert response.json()["player1_id"] == context["player"].id


def test_pending_player_cannot_be_scheduled(registration_client, registration_context):
    client, _ = registration_client
    context = registration_context
    apply_player(client, context, "player")
    pending = client.post(
        "/applications/",
        headers=auth_header(context["player_two"]),
        json={"tournament_id": context["tournament"].id},
    )
    assert pending.status_code == 200
    response = client.post(
        "/matches/",
        headers=auth_header(context["organizer"]),
        json=player_match_payload(context),
    )
    assert response.status_code == 400


def test_player_result_updates_player_leaderboard(registration_client, registration_context):
    client, _ = registration_client
    context = registration_context
    apply_player(client, context, "player")
    apply_player(client, context, "player_two")
    scheduled = client.post(
        "/matches/",
        headers=auth_header(context["organizer"]),
        json=player_match_payload(context),
    )
    response = client.put(
        f"/matches/{scheduled.json()['id']}/result",
        headers=auth_header(context["organizer"]),
        json={"winner_id": context["player"].id, "result": "2-1"},
    )
    assert response.status_code == 200
    leaderboard = client.get("/leaderboard/").json()
    rows = {row["team_name"]: row for row in leaderboard}
    assert rows["player"]["points"] == 3
    assert rows["player-two"]["losses"] == 1
