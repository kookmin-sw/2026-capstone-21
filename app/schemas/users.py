from app.db.models import User
from pydantic import BaseModel, EmailStr, Field, field_validator
import re

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=50)
    user_name: str = Field(..., min_length=2, max_length=100) # 이름 필드 추가

    @field_validator('password')
    @classmethod
    def password_complexity(cls, v: str) -> str:
        pattern = r"^(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$"
        if not re.match(pattern, v):
            raise ValueError(
                '비밀번호는 최소 8자 이상이며, 영문 소문자, 숫자, 특수문자를 각각 최소 1개 이상 포함해야 합니다.'
            )
        return v

class LoginRequest(BaseModel):
    email: EmailStr
    password: str