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
    FavoriteToggleResponse,
    FavoriteByCategoryItem,
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


# 토글 기능
@router.post("/{influencer_id}/toggle", response_model=FavoriteToggleResponse)
def toggle_favorite(
    influencer_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return FavoriteService.toggle_favorite(
        db=db,
        user_id=current_user.user_id,
        influencer_id=influencer_id,
    )


# 내 관심 목록 조회
@router.get("/", response_model=list[FavoriteInfluencerResponse])
def get_my_favorites(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return favorite_crud.get_favorites_by_user(
        db=db,
        user_id=current_user.user_id,
    )


# 카테고리별 관심 목록 조회
@router.get("/group-by-category", response_model=list[FavoriteByCategoryItem])
def get_my_favorites_group_by_category(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return favorite_crud.get_favorites_group_by_category(
        db=db,
        user_id=current_user.user_id,
    )


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


# 관심 이유 수정
@router.patch("/{influencer_id}/reason", response_model=FavoriteInfluencerResponse)
def update_my_favorite_reason(
    influencer_id: int,
    data: FavoriteInfluencerUpdateReason,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = FavoriteService.update_reason(
        db=db,
        user_id=current_user.user_id,
        influencer_id=influencer_id,
        reason=data.reason,
    )

    if result is None:
        raise HTTPException(status_code=404, detail="관심 등록 정보를 찾을 수 없습니다.")

    return result