"""Add registrations, leaderboard, and audit logs.

Revision ID: 0002
Revises: 0001
"""
from alembic import op
import sqlalchemy as sa


revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "registrations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("tournament_id", sa.Integer(), nullable=False),
        sa.Column("team_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint(
            "status IN ('pending', 'approved', 'rejected')",
            name="ck_registration_status",
        ),
        sa.ForeignKeyConstraint(["tournament_id"], ["tournaments.id"]),
        sa.ForeignKeyConstraint(["team_id"], ["teams.id"]),
        sa.UniqueConstraint("tournament_id", "team_id", name="uq_registration_tournament_team"),
    )
    op.create_index("ix_registrations_id", "registrations", ["id"], unique=False)
    op.create_index("ix_registrations_tournament_id", "registrations", ["tournament_id"], unique=False)
    op.create_index("ix_registrations_team_id", "registrations", ["team_id"], unique=False)
    op.create_index("ix_registrations_status", "registrations", ["status"], unique=False)

    op.create_table(
        "leaderboard",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("tournament_id", sa.Integer(), nullable=False),
        sa.Column("team_id", sa.Integer(), nullable=False),
        sa.Column("rank", sa.Integer(), nullable=False),
        sa.Column("points", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("wins", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("losses", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("rank > 0", name="ck_leaderboard_rank_positive"),
        sa.CheckConstraint("points >= 0", name="ck_leaderboard_points_nonnegative"),
        sa.CheckConstraint("wins >= 0", name="ck_leaderboard_wins_nonnegative"),
        sa.CheckConstraint("losses >= 0", name="ck_leaderboard_losses_nonnegative"),
        sa.ForeignKeyConstraint(["tournament_id"], ["tournaments.id"]),
        sa.ForeignKeyConstraint(["team_id"], ["teams.id"]),
        sa.UniqueConstraint("tournament_id", "team_id", name="uq_leaderboard_tournament_team"),
    )
    op.create_index("ix_leaderboard_id", "leaderboard", ["id"], unique=False)
    op.create_index("ix_leaderboard_tournament_id", "leaderboard", ["tournament_id"], unique=False)
    op.create_index("ix_leaderboard_team_id", "leaderboard", ["team_id"], unique=False)

    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("action", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
    )
    op.create_index("ix_audit_logs_id", "audit_logs", ["id"], unique=False)
    op.create_index("ix_audit_logs_user_id", "audit_logs", ["user_id"], unique=False)
    op.create_index("ix_audit_logs_created_at", "audit_logs", ["created_at"], unique=False)


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("leaderboard")
    op.drop_table("registrations")
