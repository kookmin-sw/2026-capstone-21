from sqlalchemy.orm import Session

from app.crud import favorite as crud_favorite
from app.crud import user_action_log as crud_log


class FavoriteService:
    # 관심 등록 + favorite_add 로그 기록
    @staticmethod
    def create_favorite_with_log(
        db: Session,
        user_id: int,
        influencer_id: int,
        reason: str = None,
    ):
        try:
            # 1. 관심 등록
            favorite = crud_favorite.create_favorite(
                db=db,
                user_id=user_id,
                influencer_id=influencer_id,
                reason=reason,
            )

            # 이미 관심 목록에 있으면 로그를 남기지 않는다.
            if favorite is None:
                return None

            # 2. 관심 추가 로그 기록
            crud_log.create_user_action_log(
                db=db,
                user_id=user_id,
                influencer_id=influencer_id,
                action_type="favorite_add",
            )

            # 3. 관심 등록 + 로그 기록을 한 번에 저장
            db.commit()
            db.refresh(favorite)

            return favorite

        except Exception:
            db.rollback()
            raise

    # 관심 삭제 + favorite_remove 로그 기록
    @staticmethod
    def delete_favorite_with_log(
        db: Session,
        user_id: int,
        influencer_id: int,
    ):
        try:
            # 1. 관심 삭제
            result = crud_favorite.delete_favorite(
                db=db,
                user_id=user_id,
                influencer_id=influencer_id,
            )

            # 삭제할 관심 정보가 없으면 로그를 남기지 않는다.
            if not result:
                return False

            # 2. 관심 삭제 로그 기록
            crud_log.create_user_action_log(
                db=db,
                user_id=user_id,
                influencer_id=influencer_id,
                action_type="favorite_remove",
            )

            # 3. 관심 삭제 + 로그 기록을 한 번에 저장
            db.commit()

            return True

        except Exception:
            db.rollback()
            raise