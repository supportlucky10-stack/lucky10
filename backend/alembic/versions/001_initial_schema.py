"""Initial schema and indexes migration

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-08-21 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 1. users
    op.create_table(
        'users',
        sa.Column('id', sa.String(), nullable=False, primary_key=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('username', sa.String(), nullable=False),
        sa.Column('password_hash', sa.String(), nullable=False),
        sa.Column('role', sa.String(), nullable=False, server_default='CUSTOMER'),
        sa.Column('balance', sa.Float(), nullable=False, server_default='1000.0'),
        sa.Column('mode', sa.String(), nullable=True, server_default='With Commission'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_users_id', 'users', ['id'], unique=False)
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    op.create_index('ix_users_username', 'users', ['username'], unique=True)

    # 2. bank_details
    op.create_table(
        'bank_details',
        sa.Column('id', sa.String(), nullable=False, primary_key=True),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id'), nullable=False, unique=True),
        sa.Column('account_holder_name', sa.String(), nullable=False),
        sa.Column('account_number', sa.String(), nullable=False),
        sa.Column('bank_name', sa.String(), nullable=False),
        sa.Column('ifsc', sa.String(), nullable=False),
        sa.Column('branch_name', sa.String(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_bank_details_id', 'bank_details', ['id'], unique=False)

    # 3. games
    op.create_table(
        'games',
        sa.Column('id', sa.String(), nullable=False, primary_key=True),
        sa.Column('name', sa.String(), nullable=False, unique=True),
        sa.Column('slot_time', sa.String(), nullable=False),
    )
    op.create_index('ix_games_id', 'games', ['id'], unique=False)

    # 4. game_results
    op.create_table(
        'game_results',
        sa.Column('id', sa.String(), nullable=False, primary_key=True),
        sa.Column('date', sa.String(), nullable=False),
        sa.Column('game_slot', sa.String(), nullable=False),
        sa.Column('prize1', sa.String(), nullable=False),
        sa.Column('prize2', sa.String(), nullable=False),
        sa.Column('prize3', sa.String(), nullable=False),
        sa.Column('prize4', sa.String(), nullable=False),
        sa.Column('prize5', sa.String(), nullable=True),
        sa.Column('prize6', sa.String(), nullable=True),
        sa.Column('compliments_json', sa.Text(), nullable=False, server_default='[]'),
        sa.Column('published_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_game_results_id', 'game_results', ['id'], unique=False)
    op.create_index('ix_game_results_date', 'game_results', ['date'], unique=False)
    op.create_index('ix_game_results_game_slot', 'game_results', ['game_slot'], unique=False)
    op.create_index('ix_game_results_date_slot', 'game_results', ['date', 'game_slot'], unique=False)

    # 5. tickets
    op.create_table(
        'tickets',
        sa.Column('id', sa.String(), nullable=False, primary_key=True),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('customer_name', sa.String(), nullable=True, server_default='Customer'),
        sa.Column('game_slot', sa.String(), nullable=False),
        sa.Column('total_amount', sa.Float(), nullable=False),
        sa.Column('status', sa.String(), nullable=False, server_default='PENDING'),
        sa.Column('placed_at', sa.DateTime(), nullable=False),
        sa.Column('win_amount', sa.Float(), nullable=True, server_default='0.0'),
    )
    op.create_index('ix_tickets_id', 'tickets', ['id'], unique=False)
    op.create_index('ix_tickets_user_id', 'tickets', ['user_id'], unique=False)
    op.create_index('ix_tickets_game_slot', 'tickets', ['game_slot'], unique=False)
    op.create_index('ix_tickets_placed_at', 'tickets', ['placed_at'], unique=False)

    # 6. bet_items
    op.create_table(
        'bet_items',
        sa.Column('id', sa.String(), nullable=False, primary_key=True),
        sa.Column('ticket_id', sa.String(), sa.ForeignKey('tickets.id'), nullable=False),
        sa.Column('number', sa.String(), nullable=False),
        sa.Column('count', sa.Float(), nullable=False),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('unit_price', sa.Float(), nullable=False, server_default='10.0'),
        sa.Column('total_amount', sa.Float(), nullable=False),
    )
    op.create_index('ix_bet_items_id', 'bet_items', ['id'], unique=False)
    op.create_index('ix_bet_items_ticket_id', 'bet_items', ['ticket_id'], unique=False)

    # 7. payout_requests
    op.create_table(
        'payout_requests',
        sa.Column('id', sa.String(), nullable=False, primary_key=True),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('user_name', sa.String(), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('bank_account', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False, server_default='SUCCESS'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('processed_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_payout_requests_id', 'payout_requests', ['id'], unique=False)
    op.create_index('ix_payout_requests_user_id', 'payout_requests', ['user_id'], unique=False)
    op.create_index('ix_payout_requests_created_at', 'payout_requests', ['created_at'], unique=False)

    # 8. transaction_logs
    op.create_table(
        'transaction_logs',
        sa.Column('id', sa.String(), nullable=False, primary_key=True),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('user_name', sa.String(), nullable=False),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('amount', sa.String(), nullable=False),
        sa.Column('account', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False, server_default='SUCCESS'),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_transaction_logs_id', 'transaction_logs', ['id'], unique=False)
    op.create_index('ix_transaction_logs_user_id', 'transaction_logs', ['user_id'], unique=False)
    op.create_index('ix_transaction_logs_timestamp', 'transaction_logs', ['timestamp'], unique=False)

    # 9. issues
    op.create_table(
        'issues',
        sa.Column('id', sa.String(), nullable=False, primary_key=True),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('user_name', sa.String(), nullable=False),
        sa.Column('user_email', sa.String(), nullable=False),
        sa.Column('category', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('attachment', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=False, server_default='PENDING'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_issues_id', 'issues', ['id'], unique=False)
    op.create_index('ix_issues_user_id', 'issues', ['user_id'], unique=False)

    # 10. agency_number_limits
    op.create_table(
        'agency_number_limits',
        sa.Column('id', sa.String(), nullable=False, primary_key=True),
        sa.Column('agency_id', sa.String(), nullable=False),
        sa.Column('agency_name', sa.String(), nullable=False),
        sa.Column('number', sa.String(), nullable=False),
        sa.Column('game_slot', sa.String(), nullable=False, server_default='ALL'),
        sa.Column('max_count', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_agency_number_limits_id', 'agency_number_limits', ['id'], unique=False)
    op.create_index('ix_agency_number_limits_agency_id', 'agency_number_limits', ['agency_id'], unique=False)

    # 11. blocked_numbers
    op.create_table(
        'blocked_numbers',
        sa.Column('id', sa.String(), nullable=False, primary_key=True),
        sa.Column('number', sa.String(), nullable=False),
        sa.Column('game_slot', sa.String(), nullable=False, server_default='ALL'),
        sa.Column('reason', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_blocked_numbers_id', 'blocked_numbers', ['id'], unique=False)

    # 12. global_limit_rules
    op.create_table(
        'global_limit_rules',
        sa.Column('id', sa.String(), nullable=False, primary_key=True),
        sa.Column('default_max_count', sa.Float(), nullable=False, server_default='100.0'),
        sa.Column('is_enabled', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('game_slot', sa.String(), nullable=False, server_default='ALL'),
    )
    op.create_index('ix_global_limit_rules_id', 'global_limit_rules', ['id'], unique=False)

def downgrade() -> None:
    op.drop_table('global_limit_rules')
    op.drop_table('blocked_numbers')
    op.drop_table('agency_number_limits')
    op.drop_table('issues')
    op.drop_table('transaction_logs')
    op.drop_table('payout_requests')
    op.drop_table('bet_items')
    op.drop_table('tickets')
    op.drop_table('game_results')
    op.drop_table('games')
    op.drop_table('bank_details')
    op.drop_table('users')
