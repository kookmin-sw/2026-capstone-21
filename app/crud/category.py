from __future__ import annotations
from typing import Optional, Union, List, Dict
from sqlalchemy.orm import Session

from app.db.models import Category


def get_categories(db: Session):
    return db.query(Category).filter(Category.category_name != "기타").order_by(Category.category_id.asc()).all()