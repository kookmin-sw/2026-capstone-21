from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import User
from app.utils.auth import hash_password, verify_password, create_access_token
from pydantic import BaseModel, EmailStr, Field, field_validator
import re

router = APIRouter(prefix="/auth", tags=["Auth"])

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=50)
    @field_validator('password')
    @classmethod
    def password_complexity(cls, v: str) -> str:
        # 소문자, 숫자, 특수문자(@$!%*?&)를 각각 최소 1개 이상 포함하는 8자 이상 패턴
        pattern = r"^(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$"
        
        if not re.match(pattern, v):
            raise ValueError(
                '비밀번호는 최소 8자 이상이며, 영문 소문자, 숫자, 특수문자를 각각 최소 1개 이상 포함해야 합니다.'
            )
        return v
    user_name: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    # 1. 이메일로 유저 찾기
    user = db.query(User).filter(User.email == data.email).first()
    
    # 2. 유저가 없거나 비밀번호가 틀린 경우 (보안상 상세 이유를 숨기는 게 좋음)
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="이메일 또는 비밀번호가 잘못되었습니다."
        )
    
    # 3. 계정 상태 확인 (ERD의 status 필드 활용)
    if user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="비활성화된 계정입니다. 관리자에게 문의하세요."
        )

    access_token = create_access_token(data={"sub": str(user.user_id)})

    # 4. 로그인 성공 시 응답 (나중에는 여기서 JWT 토큰을 생성해 넘겨줌)
    return {
        "message": "로그인이 성공했습니다.",
        "user_info": {
            "user_id": user.user_id,
            "user_name": user.user_name,
            "role": user.role # ERD의 role 필드 (admin/user 구분용)
        },
        "access_token": access_token, # 다음 단계에서 JWT로 교체
        "token_type": "bearer"
    }

@router.post("/signup")
def signup(data: UserCreate, db: Session = Depends(get_db)):
    # 1. 중복 이메일 체크 (UK 조건)
    exists = db.query(User).filter(User.email == data.email).first()
    if exists:
        raise HTTPException(status_code=400, detail="이미 등록된 이메일입니다.")
    
    # 2. 비번 해싱 후 저장
    new_user = User(
        email=data.email,
        password_hash=hash_password(data.password), # 원문 대신 해시값 저장
        user_name=data.user_name,
        role="user",
        status="active"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"message": "회원가입이 완료되었습니다.", "user_id": new_user.user_id}