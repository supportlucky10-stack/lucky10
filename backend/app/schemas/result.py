from pydantic import BaseModel
from typing import List, Optional

class GameResultPublishSchema(BaseModel):
    gameSlot: str
    prize1: str
    prize2: str
    prize3: str
    prize4: str
    prize5: Optional[str] = None
    compliments: List[List[str]] = []
    date: Optional[str] = None

class GameResultResponse(BaseModel):
    id: str
    date: str
    gameSlot: str
    prize1: str
    prize2: str
    prize3: str
    prize4: str
    prize5: Optional[str] = None
    compliments: List[List[str]] = []
    publishedAt: str

    class Config:
        from_attributes = True
