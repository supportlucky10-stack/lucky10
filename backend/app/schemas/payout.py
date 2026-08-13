from pydantic import BaseModel
from typing import Optional

class PayoutRequestCreate(BaseModel):
    amount: float

class PayoutLogResponse(BaseModel):
    id: str
    userId: str
    userName: str
    amount: float
    bankAccount: str
    status: str
    date: str

    class Config:
        from_attributes = True
