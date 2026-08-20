from sqlalchemy import Column, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class PayoutRequest(Base):
    __tablename__ = "payout_requests"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    user_name = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    bank_account = Column(String, nullable=False)
    status = Column(String, default="SUCCESS", nullable=False)  # SUCCESS, PROCESSING, FAILED
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    processed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="payout_requests")
