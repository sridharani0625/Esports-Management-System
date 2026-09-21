"""Baseline marker for the existing production schema.

Revision ID: 0001
Revises:
"""


revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    raise RuntimeError("Baseline downgrade is intentionally unsupported")
