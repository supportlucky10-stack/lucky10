import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.models import Ticket, BetItem, GameResult, IssueTicket, User

def reset_all_game_data():
    db = SessionLocal()
    try:
        print("Cleaning up all tickets, bet items, game results, and issues...")
        db.query(BetItem).delete()
        db.query(Ticket).delete()
        db.query(GameResult).delete()
        db.query(IssueTicket).delete()

        db.commit()
        print("Successfully cleared all test results, tickets, and game data!")
    except Exception as e:
        db.rollback()
        print(f"Error resetting database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reset_all_game_data()
