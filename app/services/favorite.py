from sqlalchemy.orm import Session
from app.crud import favorite as crud_favorite
from app.crud import user_action_log as crud_log

class FavoriteService:
    @staticmethod
    def create_favorite_with_log(db: Session, user_id: int, influencer_id: int):
        # 1. 좋아요 데이터 생성 (CRUD 호출)
        favorite = crud_favorite.create_favorite(db, user_id, influencer_id)
        
        # 2. 동시에 'favorite_add' 로그 생성 (CRUD 호출)
        crud_log.create_user_action_log(
            db, user_id, influencer_id, action_type="favorite_add"
        )
        
        # 3. (옵션) 여기서 Bandit 가중치를 즉시 업데이트하거나 로그 기반 배치 학습 유도
        return favorite

    @staticmethod
    def delete_favorite_with_log(db: Session, user_id: int, influencer_id: int):
        # 1. 좋아요 데이터 삭제
        result = crud_favorite.delete_favorite(db, user_id, influencer_id)
        
        if result:
            # 2. 삭제 성공 시에만 'favorite_remove' 로그 생성 (-2점 반영)
            crud_log.create_user_action_log(
                db, user_id, influencer_id, action_type="favorite_remove"
            )
        return result