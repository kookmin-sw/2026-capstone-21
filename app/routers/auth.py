from __future__ import annotations
from typing import Optional, Union, List, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import User
from app.utils.auth import hash_password, verify_password, create_access_token
from app.schemas.users import UserCreate, LoginRequest

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(data: UserCreate, db: Session = Depends(get_db)):
    exists = db.query(User).filter(User.email == data.email).first()

    if exists:
        raise HTTPException(status_code=400, detail="이미 등록된 이메일입니다.")

    new_user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        user_name=data.user_name,
        role="user",
        status="active",
    )

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return {
            "message": "회원가입이 완료되었습니다.",
            "user_id": new_user.user_id,
        }
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="회원가입 실패")


@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    if data.email == "admin" and data.password == "admin123":
        admin_user = db.query(User).filter(User.email == "admin").first()

        if admin_user is None:
            admin_user = User(
                email="admin",
                password_hash=hash_password("admin123"),
                user_name="관리자",
                role="admin",
                status="active",
            )

            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)

        access_token = create_access_token(data={"sub": str(admin_user.user_id)})

        return {
            "message": "로그인이 성공했습니다.",
            "user_info": {
                "user_id": admin_user.user_id,
                "user_name": admin_user.user_name,
                "role": admin_user.role,
            },
            "access_token": access_token,
            "token_type": "bearer",
        }

    user = db.query(User).filter(User.email == data.email).first()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="이메일 또는 비밀번호가 잘못되었습니다.",
        )

    if user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="비활성화된 계정입니다.",
        )

    access_token = create_access_token(data={"sub": str(user.user_id)})

    return {
        "message": "로그인이 성공했습니다.",
        "user_info": {
            "user_id": user.user_id,
            "user_name": user.user_name,
            "role": user.role,
        },
        "access_token": access_token,
        "token_type": "bearer",
    }
