from sqlalchemy import Column, String, DateTime, Text
from datetime import datetime, timezone
from app.core.database import Base

class Game(Base):
    __tablename__ = "games"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    slot_time = Column(String, nullable=False)

class GameResult(Base):
    __tablename__ = "game_results"

    id = Column(String, primary_key=True, index=True)
    date = Column(String, index=True, nullable=False)  # YYYY-MM-DD
    game_slot = Column(String, index=True, nullable=False)
    prize1 = Column(String, nullable=False)
    prize2 = Column(String, nullable=False)
    prize3 = Column(String, nullable=False)
    prize4 = Column(String, nullable=False)
    prize5 = Column(String, nullable=True)
    compliments_json = Column(Text, nullable=False, default="[]")
    published_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
