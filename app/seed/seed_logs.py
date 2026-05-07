from __future__ import annotations
from typing import Optional, Union, List, Dict
from app.db.database import SessionLocal
from app.db.models import UserActionLog

def seed_logs():
    db = SessionLocal()
    # 수동으로 넣고 싶은 로그 데이터
    sample_logs = [
        {"user_id": 1, "influencer_id": 10, "action_type": "detail_view", "reward": 1},
        {"user_id": 1, "influencer_id": 12, "action_type": "contact", "reward": 3},
    ]
    for log in sample_logs:
        db.add(UserActionLog(**log))
    db.commit()
    db.close()

seed_logs()