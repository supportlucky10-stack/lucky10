import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.models import Ticket, BetItem, GameResult, TransactionLog, PayoutRequest, IssueTicket, User

def reset_all_game_data():
    db = SessionLocal()
    try:
        print("Cleaning up all tickets, bet items, game results, and transaction logs...")
        db.query(BetItem).delete()
        db.query(Ticket).delete()
        db.query(GameResult).delete()
        db.query(TransactionLog).delete()
        db.query(PayoutRequest).delete()
        db.query(IssueTicket).delete()

        # Reset user balances to clean 1000.0
        users = db.query(User).all()
        for u in users:
            u.balance = 1000.0

        db.commit()
        print("Successfully cleared all test results, tickets, and game data!")
    except Exception as e:
        db.rollback()
        print(f"Error resetting database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reset_all_game_data()
