from sqlalchemy import Column, String, DateTime
from datetime import datetime, timezone
from app.core.database import Base

class TransactionLog(Base):
    __tablename__ = "transaction_logs"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    user_name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    amount = Column(String, nullable=False)
    account = Column(String, nullable=False)
    status = Column(String, default="SUCCESS", nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
