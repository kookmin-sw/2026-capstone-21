from datetime import datetime
from pydantic import BaseModel


# 기존 (추천 기반 로그에서 사용 가능)
class UserActionLogCreate(BaseModel):
    user_id: int
    influencer_id: int
    action_type: str


# 일반 행동로그용 (검색, 상세보기, 관심등록 등)
class UserActionLogGeneralCreate(BaseModel):
    user_id: int
    influencer_id: int
    action_type: str


# 조회용 schema
class UserActionLogRead(BaseModel):
    log_id: int
    user_id: int
    influencer_id: int
    action_type: str
    reward: int
    created_at: datetime

    class Config:
        from_attributes = True