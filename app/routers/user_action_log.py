from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.user_action_log import UserActionLogCreate
from app.services.user_action_log import UserActionLogService

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

    try:
        return UserActionLogService.create_log(
            db=db,
            data=data,
        )

    except LookupError as e:
        raise HTTPException(status_code=404, detail=str(e))

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))