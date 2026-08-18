from pydantic import BaseModel
from typing import Optional

class AgencyLimitCreate(BaseModel):
    agencyId: str
    agencyName: str
    number: str
    gameSlot: Optional[str] = "ALL"
    maxCount: float

class BlockedNumberCreate(BaseModel):
    number: str
    gameSlot: Optional[str] = "ALL"
    reason: Optional[str] = None

class GlobalLimitUpdate(BaseModel):
    defaultMaxCount: Optional[float] = 100.0
    isEnabled: Optional[bool] = False
    gameSlot: Optional[str] = "ALL"
