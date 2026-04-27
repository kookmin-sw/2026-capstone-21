from typing import List, Optional
from pydantic import BaseModel


class InfluencerResponse(BaseModel):
    influencer_id: int
    username: str
    profile_url: Optional[str] = None
    full_name: Optional[str] = None
    external_url: Optional[str] = None
    contact_email: Optional[str] = None
    followers_count: Optional[int] = None
    follows_count: Optional[int] = None
    posts_count: Optional[int] = None
    profile_pic_url: Optional[str] = None
    account_type: Optional[str] = None
    primary_category: Optional[str] = None
    style_keywords_json: Optional[List[str]] = None
    style_keywords_text: Optional[str] = None
    grade_score: Optional[float] = None

    class Config:
        from_attributes = True