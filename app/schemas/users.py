from __future__ import annotations
from typing import Optional, Union, List, Dict
from pydantic import BaseModel, EmailStr, Field, field_validator
import re

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=50)
    user_name: str = Field(..., min_length=2, max_length=100)
    mall_name: Optional[str] = None
    mall_url: Optional[str] = None

    @field_validator('password')
    @classmethod
    def password_complexity(cls, v: str) -> str:
        errors: list[str] = []
        if len(v) < 8 or len(v) > 50:
            errors.append('8~50자')
        if not re.search(r'[a-z]', v):
            errors.append('영문 소문자 1자 이상')
        if not re.search(r'\d', v):
            errors.append('숫자 1자 이상')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            errors.append('특수문자 1자 이상')
        if errors:
            raise ValueError(
                f'비밀번호 조건 미충족: {", ".join(errors)}. (8~50자, 영문 소문자+숫자+특수문자 조합 필수)'
            )
        return v

class LoginRequest(BaseModel):
    email: str
    password: str
