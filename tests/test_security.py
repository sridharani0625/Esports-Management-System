import os
from datetime import datetime, timedelta, timezone

import jwt
import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

from app.core.security import get_current_user, require_roles


os.environ["JWT_SECRET_KEY"] = "test-secret"


def token_for(role: str, user_id: int = 1) -> str:
    return jwt.encode(
        {
            "user_id": user_id,
            "role": role,
            "exp": datetime.now(timezone.utc) + timedelta(minutes=5),
        },
        os.environ["JWT_SECRET_KEY"],
        algorithm="HS256",
    )


def build_client():
    app = FastAPI()

    @app.get("/manager")
    def manager_route(user=Depends(require_roles("TEAM_MANAGER"))):
        return {"user_id": user["user_id"], "role": user["role"]}

    return TestClient(app)


def test_missing_token_is_rejected():
    response = build_client().get("/manager")

    assert response.status_code == 401
    assert response.json()["detail"] == "Authorization token required"


def test_invalid_role_is_rejected():
    response = build_client().get(
        "/manager",
        headers={"Authorization": f"Bearer {token_for('PLAYER')}"},
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Required role: TEAM_MANAGER"


def test_allowed_role_is_accepted():
    response = build_client().get(
        "/manager",
        headers={"Authorization": f"Bearer {token_for('TEAM_MANAGER', 7)}"},
    )

    assert response.status_code == 200
    assert response.json() == {"user_id": 7, "role": "TEAM_MANAGER"}


def test_unknown_role_is_rejected_as_invalid_claims():
    response = build_client().get(
        "/manager",
        headers={"Authorization": f"Bearer {token_for('UNKNOWN')}"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid token claims"


def test_require_roles_rejects_unsupported_role():
    with pytest.raises(ValueError, match="Unsupported role"):
        require_roles("MODERATOR")
