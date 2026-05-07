from __future__ import annotations
from typing import Optional, Union, List, Dict
from pydantic import BaseModel


class CategoryResponse(BaseModel):
    category_id: int
    category_name: str

    class Config:
        from_attributes = True