"""Add player participants to matches and leaderboard.

Revision ID: 0004
Revises: 0003
"""
from alembic import op
import sqlalchemy as sa


revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("matches", "team1_id", existing_type=sa.Integer(), nullable=True)
    op.alter_column("matches", "team2_id", existing_type=sa.Integer(), nullable=True)
    op.add_column("matches", sa.Column("player1_id", sa.Integer(), nullable=True))
    op.add_column("matches", sa.Column("player2_id", sa.Integer(), nullable=True))
    op.add_column("matches", sa.Column("winner_player_id", sa.Integer(), nullable=True))
    op.create_foreign_key("fk_matches_player1_user", "matches", "users", ["player1_id"], ["id"])
    op.create_foreign_key("fk_matches_player2_user", "matches", "users", ["player2_id"], ["id"])
    op.create_foreign_key("fk_matches_winner_player_user", "matches", "users", ["winner_player_id"], ["id"])

    op.alter_column("leaderboard", "team_id", existing_type=sa.Integer(), nullable=True)
    op.add_column("leaderboard", sa.Column("player_id", sa.Integer(), nullable=True))
    op.create_foreign_key("fk_leaderboard_player_user", "leaderboard", "users", ["player_id"], ["id"])
    op.create_unique_constraint(
        "uq_leaderboard_tournament_player",
        "leaderboard",
        ["tournament_id", "player_id"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_leaderboard_tournament_player", "leaderboard", type_="unique")
    op.drop_constraint("fk_leaderboard_player_user", "leaderboard", type_="foreignkey")
    op.drop_column("leaderboard", "player_id")
    op.alter_column("leaderboard", "team_id", existing_type=sa.Integer(), nullable=False)
    op.drop_constraint("fk_matches_winner_player_user", "matches", type_="foreignkey")
    op.drop_constraint("fk_matches_player2_user", "matches", type_="foreignkey")
    op.drop_constraint("fk_matches_player1_user", "matches", type_="foreignkey")
    op.drop_column("matches", "winner_player_id")
    op.drop_column("matches", "player2_id")
    op.drop_column("matches", "player1_id")
    op.alter_column("matches", "team2_id", existing_type=sa.Integer(), nullable=False)
    op.alter_column("matches", "team1_id", existing_type=sa.Integer(), nullable=False)
