from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud.user_action_log import create_user_action_log, get_logs_by_user_id
from app.db.database import get_db
from app.schemas.user_action_log import UserActionLogCreate, UserActionLogRead

router = APIRouter(prefix="/user-action-logs", tags=["user_action_logs"])


@router.post("/", response_model=UserActionLogRead)
def create_log(payload: UserActionLogCreate, db: Session = Depends(get_db)):
    try:
        return create_user_action_log(
            db=db,
            user_id=payload.user_id,
            influencer_id=payload.influencer_id,
            action_type=payload.action_type,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/users/{user_id}", response_model=list[UserActionLogRead])
def read_user_logs(user_id: int, db: Session = Depends(get_db)):
    return get_logs_by_user_id(db, user_id)