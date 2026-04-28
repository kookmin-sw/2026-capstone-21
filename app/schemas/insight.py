from pydantic import BaseModel
from typing import List, Optional


class TotalCountResponse(BaseModel):
    total: int


class TopPerformerResponse(BaseModel):
    influencer_id: int
    username: str
    profile_url: Optional[str] = None
    followers_count: Optional[int] = None
    selection_count: int


class DailyTrendResponse(BaseModel):
    date: str
    count: int


class CategoryDistributionResponse(BaseModel):
    category_name: str
    count: int


class CompareInfluencerResponse(BaseModel):
    influencer_id: int
    username: str
    profile_url: Optional[str] = None
    followers_count: Optional[int] = None
    posts_count: Optional[int] = None
    grade_score: Optional[float] = None
    categories: List[str] = []