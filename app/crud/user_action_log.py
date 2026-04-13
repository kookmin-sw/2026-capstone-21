from sqlalchemy.orm import Session
from app.db.models import UserActionLog

ACTION_REWARD_MAP = {
    "view": 1,
    "favorite_add": 2,
    "favorite_remove": -2,
    "contact": 3,
}


def create_user_action_log(db: Session, user_id: int, influencer_id: int, action_type: str):
    if action_type not in ACTION_REWARD_MAP:
        raise ValueError("지원하지 않는 action_type 입니다.")

    log = UserActionLog(
        user_id=user_id,
        influencer_id=influencer_id,
        action_type=action_type,
        reward=ACTION_REWARD_MAP[action_type],
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def get_logs_by_user_id(db: Session, user_id: int):
    return (
        db.query(UserActionLog)
        .filter(UserActionLog.user_id == user_id)
        .order_by(UserActionLog.created_at.desc())
        .all()
    )