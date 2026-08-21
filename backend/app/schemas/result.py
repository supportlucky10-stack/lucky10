from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional

class GameResultPublishSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    gameSlot: str = Field(..., min_length=1, max_length=50)
    prize1: str = Field(..., min_length=1, max_length=10)
    prize2: Optional[str] = Field(default="", max_length=10)
    prize3: Optional[str] = Field(default="", max_length=10)
    prize4: Optional[str] = Field(default="", max_length=10)
    prize5: Optional[str] = Field(default="", max_length=10)
    prize6: Optional[str] = Field(default="", max_length=10)
    compliments: List[List[str]] = []
    date: Optional[str] = None

class GameResultResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    date: str
    gameSlot: str
    prize1: str
    prize2: Optional[str] = ""
    prize3: Optional[str] = ""
    prize4: Optional[str] = ""
    prize5: Optional[str] = ""
    prize6: Optional[str] = ""
    compliments: List[List[str]] = []
    publishedAt: str
