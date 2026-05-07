from __future__ import annotations
from typing import Optional, Union, List, Dict
from sqlalchemy.orm import Session

from app.db.models import MallInput


def create_mall_input(db: Session, data):
    mall_input = MallInput(**data.dict())
    db.add(mall_input)
    db.commit()
    db.refresh(mall_input)
    return mall_input


def get_mall_inputs(db: Session):
    return db.query(MallInput).order_by(MallInput.input_id.asc()).all()