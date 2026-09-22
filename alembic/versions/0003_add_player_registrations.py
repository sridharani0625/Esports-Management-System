"""Add individual player tournament applications.

Revision ID: 0003
Revises: 0002
"""
from alembic import op
import sqlalchemy as sa


revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "player_registrations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("tournament_id", sa.Integer(), nullable=False),
        sa.Column("player_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint(
            "status IN ('pending', 'approved', 'rejected')",
            name="ck_player_registration_status",
        ),
        sa.ForeignKeyConstraint(["tournament_id"], ["tournaments.id"]),
        sa.ForeignKeyConstraint(["player_id"], ["users.id"]),
        sa.UniqueConstraint(
            "tournament_id",
            "player_id",
            name="uq_player_registration_tournament_player",
        ),
    )
    op.create_index("ix_player_registrations_id", "player_registrations", ["id"], unique=False)
    op.create_index(
        "ix_player_registrations_tournament_id",
        "player_registrations",
        ["tournament_id"],
        unique=False,
    )
    op.create_index(
        "ix_player_registrations_player_id",
        "player_registrations",
        ["player_id"],
        unique=False,
    )
    op.create_index(
        "ix_player_registrations_status",
        "player_registrations",
        ["status"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_table("player_registrations")
