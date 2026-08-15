from sqlalchemy import Column, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    customer_name = Column(String, default="Customer", nullable=True)
    game_slot = Column(String, nullable=False)
    total_amount = Column(Float, nullable=False)
    status = Column(String, default="PENDING", nullable=False)  # PENDING, WON, LOST
    placed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    win_amount = Column(Float, default=0.0)

    user = relationship("User", back_populates="tickets")
    items = relationship("BetItem", back_populates="ticket", cascade="all, delete-orphan")

class BetItem(Base):
    __tablename__ = "bet_items"

    id = Column(String, primary_key=True, index=True)
    ticket_id = Column(String, ForeignKey("tickets.id"), nullable=False, index=True)
    number = Column(String, nullable=False)
    count = Column(Float, nullable=False)
    type = Column(String, nullable=False)  # Direct, Shuffle, Pair
    unit_price = Column(Float, default=10.0, nullable=False)
    total_amount = Column(Float, nullable=False)

    ticket = relationship("Ticket", back_populates="items")
