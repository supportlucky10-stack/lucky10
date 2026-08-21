from sqlalchemy import Column, String, DateTime, Text, Index
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
    prize1 = Column(String, nullable=False, default="")
    prize2 = Column(String, nullable=True, default="")
    prize3 = Column(String, nullable=True, default="")
    prize4 = Column(String, nullable=True, default="")
    prize5 = Column(String, nullable=True, default="")
    prize6 = Column(String, nullable=True, default="")   # 6th Prize / Compliment Prize (single 3-digit number)
    compliments_json = Column(Text, nullable=False, default="[]")
    published_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        Index("ix_game_results_date_slot", "date", "game_slot"),
    )
