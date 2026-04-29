from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.db.models import FavoriteInfluencer


# 관심 등록
# FavoriteInfluencer 테이블만 처리한다.
# 로그 기록은 service에서 따로 처리한다.
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
        # 중복이면 여기서 IntegrityError 발생 가능
        db.flush()
        return favorite

    except IntegrityError:
        db.rollback()
        return None


# 특정 사용자의 관심 목록 조회
def get_favorites_by_user(db: Session, user_id: int):
    return (
        db.query(FavoriteInfluencer)
        .filter(FavoriteInfluencer.user_id == user_id)
        .all()
    )


# 관심 삭제
# 삭제만 처리하고 로그 기록은 service에서 처리한다.
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
    db.flush()

    return True


# 관심 등록 이유 수정
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