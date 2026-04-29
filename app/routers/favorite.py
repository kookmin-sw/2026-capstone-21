from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.utils.auth import get_current_user
from app.services.favorite import FavoriteService
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


# 관심 등록
@router.post("/", response_model=FavoriteInfluencerResponse)
def add_favorite(
    data: FavoriteInfluencerCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = FavoriteService.create_favorite_with_log(
        db=db,
        user_id=current_user.user_id,
        influencer_id=data.influencer_id,
        reason=data.reason,
    )

    if result is None:
        raise HTTPException(status_code=400, detail="이미 관심 목록에 있습니다.")

    return result


# 관심 삭제
@router.delete("/{influencer_id}")
def remove_favorite(
    influencer_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = FavoriteService.delete_favorite_with_log(
        db=db,
        user_id=current_user.user_id,
        influencer_id=influencer_id,
    )

    if result is False:
        raise HTTPException(status_code=404, detail="관심 등록 정보를 찾을 수 없습니다.")

    return {"message": "관심 목록에서 삭제되었습니다."}


# 특정 사용자의 관심 목록 조회
@router.get("/{user_id}", response_model=list[FavoriteInfluencerResponse])
def get_favorites_by_user(
    user_id: int,
    db: Session = Depends(get_db),
):
    return favorite_crud.get_favorites_by_user(
        db=db,
        user_id=user_id,
    )


# 관심 등록 이유 수정
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
