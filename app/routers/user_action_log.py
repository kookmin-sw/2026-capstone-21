from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud.user_action_log import create_user_action_log
from app.db.database import get_db
from app.db.models import RecommendationRun
from app.schemas.user_action_log import UserActionLogCreate
from app.services.recommendation import ReRankingBandit

router = APIRouter(prefix="/user-action-logs", tags=["user_action_logs"])


@router.post("/")
def create_log(
    data: UserActionLogCreate,
    db: Session = Depends(get_db),
):
    """
    사용자 행동 로그 통합 API

    - run_id 있음: 추천 실행 기반 로그
    - run_id 없음: 일반 탐색 로그
    """

    run_info = None

    # 추천 실행 기반 로그
    if data.run_id is not None:
        run_info = (
            db.query(RecommendationRun)
            .filter(RecommendationRun.run_id == data.run_id)
            .first()
        )

        if not run_info:
            raise HTTPException(
                status_code=404,
                detail="추천 실행 기록을 찾을 수 없습니다.",
            )

        # 추천 기반 로그는 run_id에서 user_id를 가져온다.
        user_id = run_info.user_id

    # 일반 탐색 로그
    else:
        if data.user_id is None:
            raise HTTPException(
                status_code=400,
                detail="일반 로그 저장 시 user_id가 필요합니다.",
            )

        user_id = data.user_id

    try:
        new_log = create_user_action_log(
            db=db,
            user_id=user_id,
            influencer_id=data.influencer_id,
            action_type=data.action_type,
        )

        # run_id는 nullable FK
        new_log.run_id = data.run_id

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    reward_value = new_log.reward

    # 추천 실행 기반 로그일 때만 Bandit 업데이트
    if run_info and run_info.applied_action_idx is not None:
        bandit = ReRankingBandit(db)
        bandit.update(run_info.applied_action_idx, reward_value)

    db.commit()

    return {
        "status": "success",
        "type": "recommendation_log" if data.run_id is not None else "general_log",
        "user_id": user_id,
        "influencer_id": data.influencer_id,
        "run_id": data.run_id,
        "action": data.action_type,
        "reward_given": reward_value,
        "applied_to_action_idx": run_info.applied_action_idx if run_info else None,
    }