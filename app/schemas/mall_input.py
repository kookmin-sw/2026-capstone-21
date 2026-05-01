from typing import Optional
from pydantic import BaseModel


class MallInputCreate(BaseModel):
    user_id: int
    mall_name: Optional[str] = None
    mall_url: Optional[str] = None
    input_text: str
    min_follower_count: Optional[int] = None
    max_follower_count: Optional[int] = None


class MallInputResponse(BaseModel):
    input_id: int
    user_id: int
    mall_name: Optional[str] = None
    mall_url: Optional[str] = None
    input_text: str
    min_follower_count: Optional[int] = None
    max_follower_count: Optional[int] = None

    class Config:
        from_attributes = True