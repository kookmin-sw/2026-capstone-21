from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud.user_action_log import create_user_action_log, get_logs_by_user_id
from app.db.database import get_db
from app.schemas.user_action_log import UserActionLogCreate, UserActionLogRead
from app.utils.config import ACTION_REWARD_MAP

router = APIRouter(prefix="/user-action-logs", tags=["user_action_logs"])


@router.post("/log")
def create_log(influencer_id: int, action_type: str, run_id: int, db: Session = Depends(get_db)):
    # 1. 로그 저장 (reward_value는 ACTION_REWARD_MAP에서 가져옴)
    reward_value = ACTION_REWARD_MAP.get(action_type, 0)
    new_log = UserActionLog(influencer_id=influencer_id, action_type=action_type, reward=reward_value)
    db.add(new_log)
    
    # 2. 해당 로그가 발생한 추천 실행(run) 정보를 찾음
    run_info = db.query(RecommendationRun).filter(RecommendationRun.run_id == run_id).first()
    
    # 3. Bandit 가중치 업데이트!
    if run_info:
        bandit = ReRankingBandit(db)
        # 추천 당시 사용했던 가중치 번호(action_idx)에 보상을 줌
        bandit.update(run_info.applied_action_idx, reward_value)
    
    db.commit()

@router.get("/users/{user_id}", response_model=list[UserActionLogRead])
def read_user_logs(user_id: int, db: Session = Depends(get_db)):
    return get_logs_by_user_id(db, user_id)

@router.post("/{influencer_id}/action")
def log_action(influencer_id: int, action_type: str, db: Session = Depends(get_db)):
    # 1. 유저 액션 로그 저장
    new_log = crud_log.create_log(db, influencer_id, action_type)
    
    # 2. 실시간 Bandit 업데이트 (이게 있어야 Bandit이 학습함!)
    # 클릭이면 reward=1, 무시하면 reward=0 등으로 업데이트
    reward = 1 if action_type == "favorite_add" else 0.1
    
    bandit_engine = BanditService(db)
    bandit_engine.update_weights(influencer_id, reward) # 가중치 업데이트 함수 호출
    
    return {"status": "updated", "reward": reward}