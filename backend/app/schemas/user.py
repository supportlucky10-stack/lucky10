from pydantic import BaseModel, ConfigDict
from typing import Optional

class UserCreateSchema(BaseModel):
    agencyName: str
    username: Optional[str] = None
    password: str
    mode: Optional[str] = "With Commission"

class UserAccountResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email: str
    username: str
    role: str
    mode: Optional[str] = "With Commission"
    isActive: Optional[bool] = True
    createdAt: str

