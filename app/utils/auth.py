from __future__ import annotations
from typing import Optional, Union, List, Dict
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from app.db.database import get_db
from app.db.models import User
from app.utils.setting_config import settings

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_current_user(
    db: Session = Depends(get_db), 
    token: str = Depends(oauth2_scheme)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="자격 증명을 확인 할 수 없습니다.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # 1. 토큰 Decode
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub") # 보통 'sub' 키에 user_id를 넣습니다.
        if user_id is None:
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception

    # 2. DB에서 유저 조회
    user = db.query(User).filter(User.user_id == int(user_id)).first()
    if user is None:
        raise credentials_exception
        
    return user

def create_access_token(data: dict):
    to_encode = data.copy()
    
    # 토큰 만료 시간 설정 (현재 시간 + 설정된 시간)
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    
    # JWT 토큰 생성 (보통 'sub' 키에 user_id를 넣음)
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt