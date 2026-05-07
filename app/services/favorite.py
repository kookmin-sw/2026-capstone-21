from __future__ import annotations
from typing import Optional, Union, List, Dict
from sqlalchemy.orm import Session

from app.crud import favorite as crud_favorite


class FavoriteService:

    # 관심 등록만 수행
    @staticmethod
    def create_favorite_with_log(
        db: Session,
        user_id: int,
        influencer_id: int,
        reason: str = None,
    ):
        try:
            favorite = crud_favorite.create_favorite(
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

    # 관심 삭제만 수행
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