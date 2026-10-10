from sqlalchemy import Column, String, Float, Boolean, DateTime, Index
from datetime import datetime, timezone
from app.core.database import Base

class AgencyNumberLimit(Base):
    __tablename__ = "agency_number_limits"

    id = Column(String, primary_key=True, index=True)
    agency_id = Column(String, index=True, nullable=False)
    agency_name = Column(String, nullable=False)
    number = Column(String, nullable=False, index=True)
    game_slot = Column(String, default="ALL", nullable=False, index=True)
    max_count = Column(Float, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        Index("ix_agency_limits_lookup", "agency_id", "game_slot", "number"),
    )

class BlockedNumberRule(Base):
    __tablename__ = "blocked_numbers"

    id = Column(String, primary_key=True, index=True)
    number = Column(String, nullable=False, index=True)
    game_slot = Column(String, default="ALL", nullable=False, index=True)
    reason = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        Index("ix_blocked_numbers_lookup", "game_slot", "number"),
    )

class GlobalLimitRule(Base):
    __tablename__ = "global_limit_rules"

    id = Column(String, primary_key=True, index=True)
    default_max_count = Column(Float, default=100.0, nullable=False)
    is_enabled = Column(Boolean, default=False, nullable=False)
    game_slot = Column(String, default="ALL", nullable=False)

class MaintenanceSetting(Base):
    __tablename__ = "maintenance_settings"

    id = Column(String, primary_key=True, default="default")
    is_enabled = Column(Boolean, default=False, nullable=False)
    message = Column(String, default="Server is under maintenance. Please try again later.", nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

