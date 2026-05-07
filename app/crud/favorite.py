from __future__ import annotations
from typing import Optional, Union, List, Dict
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.db.models import (
    FavoriteInfluencer,
    Influencer,
    InfluencerCategory,
    Category,
)


# 특정 사용자가 특정 인플루언서를 관심 등록했는지 조회
def get_favorite_by_user_and_influencer(
    db: Session,
    user_id: int,
    influencer_id: int,
):
    return (
        db.query(FavoriteInfluencer)
        .filter(
            FavoriteInfluencer.user_id == user_id,
            FavoriteInfluencer.influencer_id == influencer_id,
        )
        .first()
    )


# 관심 등록
# commit은 service에서 처리한다.
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
        db.flush()
        return favorite

    except IntegrityError:
        db.rollback()
        return None


# 로그인 사용자의 관심 목록 조회
def get_favorites_by_user(db: Session, user_id: int):
    return (
        db.query(FavoriteInfluencer)
        .filter(FavoriteInfluencer.user_id == user_id)
        .order_by(FavoriteInfluencer.created_at.desc())
        .all()
    )


# 관심 삭제
# commit은 service에서 처리한다.
def delete_favorite(db: Session, user_id: int, influencer_id: int):
    favorite = get_favorite_by_user_and_influencer(
        db=db,
        user_id=user_id,
        influencer_id=influencer_id,
    )

    if not favorite:
        return False

    db.delete(favorite)
    db.flush()

    return True


# 관심 등록 이유 수정
# commit은 service에서 처리한다.
def update_favorite_reason(
    db: Session,
    user_id: int,
    influencer_id: int,
    reason: str,
):
    favorite = get_favorite_by_user_and_influencer(
        db=db,
        user_id=user_id,
        influencer_id=influencer_id,
    )

    if not favorite:
        return None

    favorite.reason = reason
    db.flush()

    return favorite


# 카테고리별 관심 목록 조회
# priority=1인 대표 카테고리 기준으로 묶는다.
def get_favorites_group_by_category(db: Session, user_id: int):
    rows = (
        db.query(FavoriteInfluencer, Category)
        .join(
            Influencer,
            FavoriteInfluencer.influencer_id == Influencer.influencer_id,
        )
        .outerjoin(
            InfluencerCategory,
            Influencer.influencer_id == InfluencerCategory.influencer_id,
        )
        .outerjoin(
            Category,
            InfluencerCategory.category_id == Category.category_id,
        )
        .filter(FavoriteInfluencer.user_id == user_id)
        .filter(
            (InfluencerCategory.priority == 1)
            | (InfluencerCategory.priority.is_(None))
        )
        .order_by(Category.category_name.asc(), FavoriteInfluencer.created_at.desc())
        .all()
    )

    grouped = {}

    for favorite, category in rows:
        category_id = category.category_id if category else None
        category_name = category.category_name if category else "미분류"

        key = category_id or 0

        if key not in grouped:
            grouped[key] = {
                "category_id": category_id,
                "category_name": category_name,
                "favorites": [],
            }

        grouped[key]["favorites"].append(favorite)

    return list(grouped.values())