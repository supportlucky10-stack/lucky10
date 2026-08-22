"""Production hardening indexes and ticket counter migration

Revision ID: 002_production_hardening_indexes
Revises: 001_initial_schema
Create Date: 2026-08-22 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '002_production_hardening_indexes'
down_revision = '001_initial_schema'
branch_labels = None
depends_on = None

def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    # 1. Create ticket_counters table if not exists
    tables = inspector.get_table_names()
    if 'ticket_counters' not in tables:
        op.create_table(
            'ticket_counters',
            sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
            sa.Column('current_val', sa.BigInteger(), nullable=False, server_default='2243296'),
        )

        # Dynamic max ticket ID calculation to ensure existing production tickets are never collided with
        max_num = 2243296
        if 'tickets' in tables:
            rows = conn.execute(sa.text("SELECT id FROM tickets")).fetchall()
            for (tid,) in rows:
                digits = ''.join(filter(str.isdigit, str(tid or '')))
                if digits:
                    try:
                        val = int(digits)
                        if val > max_num:
                            max_num = val
                    except Exception:
                        pass
        conn.execute(
            sa.text("INSERT INTO ticket_counters (id, current_val) VALUES (1, :val)"),
            {"val": max_num}
        )

    # 2. Add performance indexes safely (check if index exists before creating)
    def index_exists(table_name: str, index_name: str) -> bool:
        if table_name not in tables:
            return False
        indexes = [idx['name'] for idx in inspector.get_indexes(table_name)]
        return index_name in indexes

    if not index_exists('tickets', 'ix_tickets_status'):
        op.create_index('ix_tickets_status', 'tickets', ['status'], unique=False)

    if not index_exists('tickets', 'ix_tickets_user_slot_placed'):
        op.create_index('ix_tickets_user_slot_placed', 'tickets', ['user_id', 'game_slot', 'placed_at'], unique=False)

    if not index_exists('bet_items', 'ix_bet_items_number'):
        op.create_index('ix_bet_items_number', 'bet_items', ['number'], unique=False)

    if not index_exists('agency_number_limits', 'ix_agency_limits_lookup'):
        op.create_index('ix_agency_limits_lookup', 'agency_number_limits', ['agency_id', 'game_slot', 'number'], unique=False)

    if not index_exists('blocked_numbers', 'ix_blocked_numbers_lookup'):
        op.create_index('ix_blocked_numbers_lookup', 'blocked_numbers', ['game_slot', 'number'], unique=False)


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    def index_exists(table_name: str, index_name: str) -> bool:
        if table_name not in tables:
            return False
        indexes = [idx['name'] for idx in inspector.get_indexes(table_name)]
        return index_name in indexes

    if index_exists('blocked_numbers', 'ix_blocked_numbers_lookup'):
        op.drop_index('ix_blocked_numbers_lookup', table_name='blocked_numbers')

    if index_exists('agency_number_limits', 'ix_agency_limits_lookup'):
        op.drop_index('ix_agency_limits_lookup', table_name='agency_number_limits')

    if index_exists('bet_items', 'ix_bet_items_number'):
        op.drop_index('ix_bet_items_number', table_name='bet_items')

    if index_exists('tickets', 'ix_tickets_user_slot_placed'):
        op.drop_index('ix_tickets_user_slot_placed', table_name='tickets')

    if index_exists('tickets', 'ix_tickets_status'):
        op.drop_index('ix_tickets_status', table_name='tickets')

    if 'ticket_counters' in tables:
        op.drop_table('ticket_counters')
