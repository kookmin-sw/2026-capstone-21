from sqlalchemy.orm import Session

from app.crud import favorite as crud_favorite
from app.crud import user_action_log as crud_log


class FavoriteService:

    # 관심 등록 + 로그 기록
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

            # 이미 있으면 종료
            if favorite is None:
                return None

            # 2. 로그 기록
            crud_log.create_user_action_log(
                db=db,
                user_id=user_id,
                influencer_id=influencer_id,
                action_type="favorite_add",
            )

            # 3. commit
            db.commit()
            db.refresh(favorite)

            return favorite

        except Exception:
            db.rollback()
            raise


    # 관심 삭제 + 로그 기록
    @staticmethod
    def delete_favorite_with_log(
        db: Session,
        user_id: int,
        influencer_id: int,
    ):
        try:
            result = crud_favorite.delete_favorite(
                db=db,
                user_id=user_id,
                influencer_id=influencer_id,
            )

            if not result:
                return False

            # 로그 기록
            crud_log.create_user_action_log(
                db=db,
                user_id=user_id,
                influencer_id=influencer_id,
                action_type="favorite_remove",
            )

            db.commit()
            return True

        except Exception:
            db.rollback()
            raise


    # toggle 기능
    @staticmethod
    def toggle_favorite(
        db: Session,
        user_id: int,
        influencer_id: int,
        reason: str = None,
    ):
        favorite = crud_favorite.get_favorite_by_user_and_influencer(
            db=db,
            user_id=user_id,
            influencer_id=influencer_id,
        )

        # 이미 있으면 삭제
        if favorite:
            FavoriteService.delete_favorite_with_log(
                db=db,
                user_id=user_id,
                influencer_id=influencer_id,
            )

            return {
                "status": "removed",
                "message": "관심 목록에서 삭제됨",
                "favorite": None,
            }

        # 없으면 추가
        created = FavoriteService.create_favorite_with_log(
            db=db,
            user_id=user_id,
            influencer_id=influencer_id,
            reason=reason,
        )

        return {
            "status": "added",
            "message": "관심 목록 추가됨",
            "favorite": created,
        }


    # 이유 수정
    @staticmethod
    def update_reason(
        db: Session,
        user_id: int,
        influencer_id: int,
        reason: str,
    ):
        try:
            favorite = crud_favorite.update_favorite_reason(
                db=db,
                user_id=user_id,
                influencer_id=influencer_id,
                reason=reason,
            )

            if favorite is None:
                return None

            db.commit()
            db.refresh(favorite)

            return favorite

        except Exception:
            db.rollback()
            raise