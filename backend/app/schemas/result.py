from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional

class GameResultPublishSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    gameSlot: str = Field(..., min_length=1, max_length=50)
    prize1: str = Field(..., min_length=1, max_length=10)
    prize2: str = Field(..., min_length=1, max_length=10)
    prize3: str = Field(..., min_length=1, max_length=10)
    prize4: str = Field(..., min_length=1, max_length=10)
    prize5: Optional[str] = None
    prize6: Optional[str] = None
    compliments: List[List[str]] = []
    date: Optional[str] = None

class GameResultResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    date: str
    gameSlot: str
    prize1: str
    prize2: str
    prize3: str
    prize4: str
    prize5: Optional[str] = None
    prize6: Optional[str] = None
    compliments: List[List[str]] = []
    publishedAt: str
