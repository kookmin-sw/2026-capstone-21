from sqlalchemy.orm import Session

from app.db.models import UserActionLog


# 행동별 reward 값
# 개인화 점수 계산이 아니라, 로그에 저장할 기본 행동 점수이다.
ACTION_REWARD_MAP = {
    "detail_view": 1,
    "favorite_add": 2,
    "favorite_remove": -2,
    "contact": 3,
    "collaboration_complete": 4,
}


# 사용자 행동 로그 생성
# commit은 service에서 한 번에 처리한다.
def create_user_action_log(
    db: Session,
    user_id: int,
    influencer_id: int,
    action_type: str,
):
    if action_type not in ACTION_REWARD_MAP:
        raise ValueError("지원하지 않는 action_type 입니다.")

    log = UserActionLog(
        user_id=user_id,
        influencer_id=influencer_id,
        action_type=action_type,
        reward=ACTION_REWARD_MAP[action_type],
    )

    db.add(log)
    db.flush()

    return log


# 특정 사용자의 행동 로그 조회
def get_logs_by_user_id(db: Session, user_id: int):
    return (
        db.query(UserActionLog)
        .filter(UserActionLog.user_id == user_id)
        .order_by(UserActionLog.created_at.desc())
        .all()
    )