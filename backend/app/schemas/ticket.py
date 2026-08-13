from pydantic import BaseModel
from typing import List, Optional

class BetItemSchema(BaseModel):
    id: Optional[str] = None
    number: str
    count: float
    type: str  # Direct, Shuffle, Pair
    unitPrice: float = 10.0
    totalAmount: float

    class Config:
        from_attributes = True

class TicketCreateSchema(BaseModel):
    gameSlot: str
    items: List[BetItemSchema]
    totalAmount: float
    actionType: Optional[str] = "PAY"  # PAY or SAVE

class PlacedTicketResponse(BaseModel):
    id: str
    userId: str
    gameSlot: str
    items: List[BetItemSchema]
    totalAmount: float
    placedAt: str
    status: str
    winAmount: Optional[float] = 0.0

    class Config:
        from_attributes = True
