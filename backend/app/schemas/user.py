from pydantic import BaseModel
from typing import Optional

class BankDetailsSchema(BaseModel):
    accountHolderName: str
    accountNo: str
    bankName: str
    ifsc: str
    branchName: str
    updatedAt: Optional[str] = None

    class Config:
        from_attributes = True

class UserCreateSchema(BaseModel):
    agencyName: str
    password: str
    mode: Optional[str] = "With Commission"

class UserAccountResponse(BaseModel):
    id: str
    name: str
    email: str
    username: str
    role: str
    balance: float
    mode: Optional[str] = "With Commission"
    isActive: Optional[bool] = True
    bankDetails: Optional[BankDetailsSchema] = None
    createdAt: str

    class Config:
        from_attributes = True

