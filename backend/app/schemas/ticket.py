from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import List, Optional

VALID_GAME_SLOTS = {"1 PM Game", "3 PM Game", "6 PM Game", "8 PM Game"}

class BetItemSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Optional[str] = None
    number: str = Field(..., min_length=1, max_length=30)
    count: float = Field(..., gt=0)
    type: str = Field(..., min_length=1, max_length=30)
    unitPrice: float = Field(default=10.0, gt=0)
    totalAmount: Optional[float] = None

    @field_validator("number")
    @classmethod
    def validate_number(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("Bet number cannot be blank.")
        return clean

class TicketCreateSchema(BaseModel):
    gameSlot: str = Field(..., min_length=1, max_length=50)
    items: List[BetItemSchema] = Field(..., min_length=1)
    totalAmount: float = Field(..., gt=0)
    actionType: Optional[str] = "PAY"  # PAY or SAVE
    customerName: Optional[str] = "Customer"

    @field_validator("actionType")
    @classmethod
    def validate_action_type(cls, v: Optional[str]) -> str:
        if v and v.upper() in {"PAY", "SAVE"}:
            return v.upper()
        return "PAY"

class PlacedTicketResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    userId: str
    customerName: Optional[str] = "Customer"
    gameSlot: str
    items: List[BetItemSchema]
    totalAmount: float
    placedAt: str
    status: str
    winAmount: Optional[float] = 0.0
