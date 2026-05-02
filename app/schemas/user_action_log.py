from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class UserActionLogCreate(BaseModel):
    user_id: Optional[int] = None
    influencer_id: int
    action_type: str
    run_id: Optional[int] = None


class UserActionLogRead(BaseModel):
    log_id: int
    user_id: int
    influencer_id: int
    run_id: Optional[int] = None
    action_type: str
    reward: int
    created_at: datetime

    class Config:
        from_attributes = True