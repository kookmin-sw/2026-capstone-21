from datetime import datetime
from pydantic import BaseModel


class UserActionLogCreate(BaseModel):
    user_id: int
    influencer_id: int
    action_type: str


class UserActionLogRead(BaseModel):
    log_id: int
    user_id: int
    influencer_id: int
    action_type: str
    reward: int
    created_at: datetime

    class Config:
        from_attributes = True