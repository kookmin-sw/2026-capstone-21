from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import User
from app.utils.auth import hash_password, verify_password, create_access_token
from pydantic import BaseModel, EmailStr, Field, field_validator
import re
from app.schemas.users import UserCreate, LoginRequest

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(data: UserCreate, db: Session = Depends(get_db)):
    # 1. 중복 이메일 체크
    exists = db.query(User).filter(User.email == data.email).first()
    if exists:
        raise HTTPException(status_code=400, detail="이미 등록된 이메일입니다.")
    
    # 2. 유저 생성 (user_id는 DB에서 자동 배정됨)
    new_user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        user_name=data.user_name,
        role="user",
        status="active"
    )
    
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user) # 여기서 자동 생성된 user_id를 읽어옴
        return {
            "message": "회원가입이 완료되었습니다.", 
            "user_id": new_user.user_id
        }
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="회원가입 실패")

@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    # 1. 유저 조회
    user = db.query(User).filter(User.email == data.email).first()
    
    # 2. 비밀번호 검증
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="이메일 또는 비밀번호가 잘못되었습니다."
        )
    
    # 3. 계정 활성화 상태 확인
    if user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="비활성화된 계정입니다."
        )

    # 4. JWT 토큰 생성 (sub에 user_id를 넣어 식별함)
    access_token = create_access_token(data={"sub": str(user.user_id)})

    return {
        "message": "로그인이 성공했습니다.",
        "user_info": {
            "user_id": user.user_id,
            "user_name": user.user_name,
            "role": user.role
        },
        "access_token": access_token,
        "token_type": "bearer"
    }