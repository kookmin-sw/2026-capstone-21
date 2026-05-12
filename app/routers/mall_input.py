from __future__ import annotations
from typing import Optional, Union, List, Dict
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.crud import mall_input as crud_mall
from app.db.database import get_db
from app.db.models import User
from app.schemas.mall_input import MallInputCreate, MallInputResponse

router = APIRouter(prefix="/mall-inputs", tags=["MallInput"])


@router.post("/", response_model=MallInputResponse)
def create_mall_input(data: MallInputCreate, db: Session = Depends(get_db)):
    # User의 mall_name/mall_url이 비어있으면 자동으로 채움
    if not data.mall_name or not data.mall_url:
        user = db.query(User).filter(User.user_id == data.user_id).first()
        if user:
            if not data.mall_name and user.mall_name:
                data.mall_name = user.mall_name
            if not data.mall_url and user.mall_url:
                data.mall_url = user.mall_url
    return crud_mall.create_mall_input(db, data)


@router.get("/", response_model=list[MallInputResponse])
def get_mall_inputs(db: Session = Depends(get_db)):
    return crud_mall.get_mall_inputs(db)