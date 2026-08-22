import sys
import os

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.core.database import SessionLocal
from app.models import (
    User,
    Ticket,
    BetItem,
    IssueTicket,
    AgencyNumberLimit,
)

def delete_demo_user():
    db = SessionLocal()
    try:
        demo_users = db.query(User).filter(
            (User.id == "user_demo_001") | (User.username.ilike("demo")) | (User.email.ilike("demo@lucky10.com"))
        ).all()

        if not demo_users:
            print("[Lucky10] No demo user accounts found in database.")
            return

        demo_user_ids = [u.id for u in demo_users]
        print(f"[Lucky10] Found {len(demo_users)} demo account(s) to remove: {demo_user_ids}")

        # Find tickets associated with demo users
        demo_tickets = db.query(Ticket).filter(Ticket.user_id.in_(demo_user_ids)).all()
        demo_ticket_ids = [t.id for t in demo_tickets]

        if demo_ticket_ids:
            print(f"[Lucky10] Deleting {len(demo_ticket_ids)} demo ticket(s) and their bet items...")
            db.query(BetItem).filter(BetItem.ticket_id.in_(demo_ticket_ids)).delete(synchronize_session=False)
            db.query(Ticket).filter(Ticket.id.in_(demo_ticket_ids)).delete(synchronize_session=False)

        print("[Lucky10] Deleting associated issues and limits...")
        db.query(IssueTicket).filter(IssueTicket.user_id.in_(demo_user_ids)).delete(synchronize_session=False)
        db.query(AgencyNumberLimit).filter(AgencyNumberLimit.agency_id.in_(demo_user_ids)).delete(synchronize_session=False)

        # Delete users
        db.query(User).filter(User.id.in_(demo_user_ids)).delete(synchronize_session=False)

        db.commit()
        print("[Lucky10] Successfully removed demo account and all associated data.")
    except Exception as e:
        db.rollback()
        print(f"[Lucky10 Error] Failed to delete demo account: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    delete_demo_user()
