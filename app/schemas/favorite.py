from __future__ import annotations
from typing import Optional, Union, List, Dict
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


# 관심 등록 요청
# user_id는 프론트에서 받지 않는다.
# 로그인한 사용자(current_user)의 user_id를 백엔드에서 사용한다.
class FavoriteInfluencerCreate(BaseModel):
    influencer_id: int
    reason: Optional[str] = None


# 관심 이유 수정 요청
class FavoriteInfluencerUpdateReason(BaseModel):
    reason: Optional[str] = None


# 관심 목록 응답
class FavoriteInfluencerResponse(BaseModel):
    favorite_id: int
    user_id: int
    influencer_id: int
    reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# 관심 토글 응답
class FavoriteToggleResponse(BaseModel):
    status: str
    message: str
    favorite: Optional[FavoriteInfluencerResponse] = None


# 카테고리별 관심 목록 응답
class FavoriteByCategoryItem(BaseModel):
    category_id: Optional[int] = None
    category_name: str
    favorites: list[FavoriteInfluencerResponse]