from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.db.models import FavoriteInfluencer, UserActionLog


# 행동 로그 기준값
ACTION_FAVORITE_ADD = "favorite_add"
ACTION_FAVORITE_REMOVE = "favorite_remove"

REWARD_FAVORITE_ADD = 2
REWARD_FAVORITE_REMOVE = -2


# 1. 관심 등록
def create_favorite(
    db: Session,
    user_id: int,
    influencer_id: int,
    reason: str = None,
):
    favorite = FavoriteInfluencer(
        user_id=user_id,
        influencer_id=influencer_id,
        reason=reason,
    )

    db.add(favorite)

    try:
        db.flush()  # 중복이면 여기서 IntegrityError 발생

        log = UserActionLog(
            user_id=user_id,
            influencer_id=influencer_id,
            action_type=ACTION_FAVORITE_ADD,
            reward=REWARD_FAVORITE_ADD,
        )
        db.add(log)

        db.commit()
        db.refresh(favorite)
        return favorite

    except IntegrityError:
        db.rollback()
        return None  # 이미 관심 목록에 있는 경우


# 2. 관심 목록 조회
def get_favorites_by_user(db: Session, user_id: int):
    return (
        db.query(FavoriteInfluencer)
        .filter(FavoriteInfluencer.user_id == user_id)
        .all()
    )


# 3. 관심 삭제
def delete_favorite(db: Session, user_id: int, influencer_id: int):
    favorite = (
        db.query(FavoriteInfluencer)
        .filter(
            FavoriteInfluencer.user_id == user_id,
            FavoriteInfluencer.influencer_id == influencer_id,
        )
        .first()
    )

    if not favorite:
        return False

    db.delete(favorite)

    log = UserActionLog(
        user_id=user_id,
        influencer_id=influencer_id,
        action_type=ACTION_FAVORITE_REMOVE,
        reward=REWARD_FAVORITE_REMOVE,
    )
    db.add(log)

    db.commit()
    return True


# 4. 이유 수정
def update_favorite_reason(
    db: Session,
    user_id: int,
    influencer_id: int,
    reason: str,
):
    favorite = (
        db.query(FavoriteInfluencer)
        .filter(
            FavoriteInfluencer.user_id == user_id,
            FavoriteInfluencer.influencer_id == influencer_id,
        )
        .first()
    )

    if not favorite:
        return None

    favorite.reason = reason
    db.commit()
    db.refresh(favorite)

    return favorite