from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud.user_action_log import create_user_action_log
from app.db.database import get_db
from app.services.recommendation import ReRankingBandit
from app.db.models import RecommendationRun
from app.schemas.user_action_log import UserActionLogGeneralCreate

router = APIRouter(prefix="/user-action-logs", tags=["user_action_logs"])


# 기존 추천 기반 로그
@router.post("/log")
def create_log(
    influencer_id: int,
    action_type: str,
    run_id: int,
    db: Session = Depends(get_db)
):
    run_info = db.query(RecommendationRun).filter(
        RecommendationRun.run_id == run_id
    ).first()

    if not run_info:
        raise HTTPException(status_code=404, detail="추천 실행 기록을 찾을 수 없습니다.")

    new_log = create_user_action_log(
        db=db,
        user_id=run_info.user_id,
        influencer_id=influencer_id,
        action_type=action_type,
    )

    reward_value = new_log.reward

    # run에 저장된 bandit action_idx가 있을 때만 업데이트
    if run_info.applied_action_idx is not None:
        bandit = ReRankingBandit(db)
        bandit.update(run_info.applied_action_idx, reward_value)

    db.commit()

    return {
        "status": "success",
        "type": "recommendation_log",
        "action": action_type,
        "reward_given": reward_value,
        "applied_to_action_idx": run_info.applied_action_idx
    }


# 일반 행동로그 API
@router.post("/general")
def create_general_log(
    data: UserActionLogGeneralCreate,
    db: Session = Depends(get_db)
):
    new_log = create_user_action_log(
        db=db,
        user_id=data.user_id,
        influencer_id=data.influencer_id,
        action_type=data.action_type,
    )

    db.commit()

    return {
        "status": "success",
        "type": "general_log",
        "action": data.action_type,
        "reward_given": new_log.reward
    }