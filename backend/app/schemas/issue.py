from pydantic import BaseModel
from typing import Optional

class IssueCreateSchema(BaseModel):
    category: str
    description: str
    attachment: Optional[str] = None

class IssueResponseSchema(BaseModel):
    id: str
    userId: str
    userName: str
    userEmail: str
    category: str
    description: str
    attachment: Optional[str] = None
    date: str
    status: str

    class Config:
        from_attributes = True
