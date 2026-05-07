from __future__ import annotations
from typing import Optional, Union, List, Dict
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.crud import mall_input as crud_mall
from app.db.database import get_db
from app.schemas.mall_input import MallInputCreate, MallInputResponse

router = APIRouter(prefix="/mall-inputs", tags=["MallInput"])


@router.post("/", response_model=MallInputResponse)
def create_mall_input(data: MallInputCreate, db: Session = Depends(get_db)):
    return crud_mall.create_mall_input(db, data)


@router.get("/", response_model=list[MallInputResponse])
def get_mall_inputs(db: Session = Depends(get_db)):
    return crud_mall.get_mall_inputs(db)