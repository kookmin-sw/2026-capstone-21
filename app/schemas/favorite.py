from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class FavoriteInfluencerCreate(BaseModel):
    user_id: int
    influencer_id: int
    reason: Optional[str] = None


class FavoriteInfluencerUpdateReason(BaseModel):
    reason: Optional[str] = None


class FavoriteInfluencerResponse(BaseModel):
    favorite_id: int
    user_id: int
    influencer_id: int
    reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True