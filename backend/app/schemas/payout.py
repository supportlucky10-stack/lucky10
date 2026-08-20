from pydantic import BaseModel, ConfigDict, Field
from typing import Optional

class PayoutRequestCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    amount: float = Field(..., gt=0)

class PayoutLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    userId: str
    userName: str
    amount: float
    bankAccount: str
    status: str
    date: str
