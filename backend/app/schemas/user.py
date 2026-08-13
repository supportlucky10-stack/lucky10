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

class UserAccountResponse(BaseModel):
    id: str
    name: str
    email: str
    username: str
    role: str
    balance: float
    bankDetails: Optional[BankDetailsSchema] = None
    createdAt: str

    class Config:
        from_attributes = True
