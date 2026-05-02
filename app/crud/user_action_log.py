from sqlalchemy.orm import Session
from app.db.models import UserActionLog


# 행동별 기본 reward 값 정의
# (개인화 점수 계산용이 아니라, 로그 저장 시 기본 점수)
ACTION_REWARD_MAP = {
    "detail_view": 1,
    "favorite_add": 2,
    "favorite_remove": -2,
    "contact": 3,
    "collaboration_complete": 4,
}


# 사용자 행동 로그 생성 함수
def create_user_action_log(
    db: Session,
    user_id: int,
    influencer_id: int,
    action_type: str,
    reward: int | None = None,  # ← 외부에서 reward를 직접 넘길 수도 있게 optional 처리
):
    # 지원하지 않는 action_type이면 에러
    if action_type not in ACTION_REWARD_MAP:
        raise ValueError("지원하지 않는 action_type 입니다.")

    # reward가 전달된 경우 → 그 값 사용
    # 전달되지 않은 경우 → 기본 ACTION_REWARD_MAP 값 사용
    final_reward = reward if reward is not None else ACTION_REWARD_MAP[action_type]

    # DB에 저장할 로그 객체 생성
    log = UserActionLog(
        user_id=user_id,
        influencer_id=influencer_id,
        action_type=action_type,
        reward=final_reward,
    )

    # DB 세션에 추가 (아직 commit은 안 함)
    db.add(log)

    # flush로 DB에 반영 (id 등 생성)
    db.flush()

    return log


# 특정 사용자의 행동 로그 조회
def get_logs_by_user_id(db: Session, user_id: int):
    return (
        db.query(UserActionLog)
        .filter(UserActionLog.user_id == user_id)
        .order_by(UserActionLog.created_at.desc())  # 최신순 정렬
        .all()
    )