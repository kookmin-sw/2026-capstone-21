from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.crud import favorite as favorite_crud
from app.schemas.favorite import (
    FavoriteInfluencerCreate,
    FavoriteInfluencerUpdateReason,
    FavoriteInfluencerResponse,
)

router = APIRouter(
    prefix="/favorites",
    tags=["favorites"],
)


@router.post("/")
def add_favorite(influencer_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return FavoriteService.create_favorite_with_log(db, current_user.id, influencer_id)

@router.delete("/{influencer_id}")
def remove_favorite(influencer_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return FavoriteService.delete_favorite_with_log(db, current_user.id, influencer_id)



@router.get("/{user_id}", response_model=list[FavoriteInfluencerResponse])
def get_favorites_by_user(
    user_id: int,
    db: Session = Depends(get_db),
):
    return favorite_crud.get_favorites_by_user(db=db, user_id=user_id)


@router.patch("/{user_id}/{influencer_id}/reason", response_model=FavoriteInfluencerResponse)
def update_favorite_reason(
    user_id: int,
    influencer_id: int,
    data: FavoriteInfluencerUpdateReason,
    db: Session = Depends(get_db),
):
    result = favorite_crud.update_favorite_reason(
        db=db,
        user_id=user_id,
        influencer_id=influencer_id,
        reason=data.reason,
    )

    if result is None:
        raise HTTPException(status_code=404, detail="관심 등록 정보를 찾을 수 없습니다.")

    return result
