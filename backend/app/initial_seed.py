import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

import json
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.core.database import engine, Base, SessionLocal
from app.core.security import get_password_hash
from app.models import User, Game, GameResult
from app.models.user import UserRole

def seed_db():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    try:
        # 1. Seed Admin
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            admin_user = User(
                id="user_admin_001",
                name="System Admin",
                email="admin@lucky10.com",
                username="admin",
                password_hash=get_password_hash("admin123"),
                role=UserRole.ADMIN,
                balance=0.0,
            )
            db.add(admin_user)
            print("--> Seeded default Admin (admin / admin123)")

        # 2. Seed Demo Player (for testing / Vercel hosted demo)
        demo = db.query(User).filter(User.username == "demo").first()
        if not demo:
            demo_user = User(
                id="user_demo_001",
                name="Demo Player",
                email="demo@lucky10.com",
                username="demo",
                password_hash=get_password_hash("demo123"),
                role=UserRole.CUSTOMER,
                balance=5000.0,
            )
            db.add(demo_user)
            print("--> Seeded default Demo Player (demo / demo123)")

        # 3. Seed Games
        slots = ["1 PM Game", "3 PM Game", "6 PM Game", "8 PM Game"]
        for slot in slots:
            g = db.query(Game).filter(Game.name == slot).first()
            if not g:
                db.add(Game(id=f"game_{slot.replace(' ', '_').lower()}", name=slot, slot_time=slot.split(" ")[0]))
        
        # 3. Seed Today Results if empty
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        existing_results = db.query(GameResult).filter(GameResult.date == today_str).all()
        if not existing_results:
            sample_results = [
                {
                    "id": "res_1",
                    "date": today_str,
                    "game_slot": "1 PM Game",
                    "prize1": "742",
                    "prize2": "819",
                    "prize3": "350",
                    "prize4": "194",
                    "prize5": "408",
                    "compliments_json": json.dumps([
                        ["743", "741", "744", "740", "745"],
                        ["820", "818", "821", "817", "822"],
                        ["351", "349", "352", "348", "353"],
                        ["195", "193", "196", "192", "197"],
                    ]),
                },
                {
                    "id": "res_2",
                    "date": today_str,
                    "game_slot": "3 PM Game",
                    "prize1": "512",
                    "prize2": "934",
                    "prize3": "601",
                    "prize4": "287",
                    "prize5": "739",
                    "compliments_json": json.dumps([
                        ["513", "511", "514", "510", "515"],
                        ["935", "933", "936", "932", "937"],
                    ]),
                },
                {
                    "id": "res_3",
                    "date": today_str,
                    "game_slot": "6 PM Game",
                    "prize1": "389",
                    "prize2": "145",
                    "prize3": "720",
                    "prize4": "963",
                    "prize5": "521",
                    "compliments_json": json.dumps([
                        ["390", "388", "391", "387", "392"],
                    ]),
                },
                {
                    "id": "res_4",
                    "date": today_str,
                    "game_slot": "8 PM Game",
                    "prize1": "624",
                    "prize2": "471",
                    "prize3": "809",
                    "prize4": "536",
                    "prize5": "315",
                    "compliments_json": json.dumps([
                        ["625", "623", "626", "622", "627"],
                    ]),
                },
            ]
            for r in sample_results:
                db.add(GameResult(**r))
            print("--> Seeded default Game Results for today")

        db.commit()
    except Exception as e:
        print(f"Error seeding db: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
