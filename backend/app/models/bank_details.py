from sqlalchemy import Column, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class BankDetails(Base):
    __tablename__ = "bank_details"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    account_holder_name = Column(String, nullable=False)
    account_number = Column(String, nullable=False)
    bank_name = Column(String, nullable=False)
    ifsc = Column(String, nullable=False)
    branch_name = Column(String, nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="bank_details")
