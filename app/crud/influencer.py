from __future__ import annotations
from typing import Optional, Union, List, Dict
from sqlalchemy.orm import Session, joinedload
import pandas as pd
from app.db.models import Influencer, InfluencerCategory, InfluencerPost, InfluencerRelated


def influencer_to_response(influencer: Influencer):
    # 인플루언서 객체를 딕셔너리로 변환하는 공통 로직
    # (코드 중복을 방지하기 위해 crud 내부에 유지하거나 별도 util로 분리 가능)
    primary_cat = None
    for ic in influencer.influencer_categories:
        if ic.priority == 1 and ic.category:
            primary_cat = ic.category.category_name
            break

    return {
        "influencer_id": influencer.influencer_id,
        "username": influencer.username,
        "profile_url": influencer.profile_url,
        "full_name": influencer.full_name,
        "external_url": influencer.external_url,
        "contact_email": influencer.contact_email,
        "followers_count": influencer.followers_count,
        "follows_count": influencer.follows_count,
        "posts_count": influencer.posts_count,
        "profile_pic_url": influencer.profile_pic_url,
        "account_type": influencer.account_type,
        "grade_score": influencer.grade_score,
        "style_keywords_json": influencer.style_keywords_json,
        "style_keywords_text": influencer.style_keywords_text,
        "primary_category": primary_cat,

        # ✅ 필요 시 프론트/관리자에서 상태 확인 가능
        "is_active": influencer.is_active,
    }


def get_influencers(db: Session):
    influencers = (
        db.query(Influencer)
        .options(
            joinedload(Influencer.influencer_categories).joinedload(
                InfluencerCategory.category
            )
        )

        # ✅ 일반 사용자 조회에서는 제외 계정 숨김
        .filter(Influencer.is_active.is_(True))

        .order_by(Influencer.influencer_id.asc())
        .all()
    )

    return [influencer_to_response(influencer) for influencer in influencers]


def get_influencer_by_id(db: Session, influencer_id: int):
    influencer = (
        db.query(Influencer)
        .options(
            joinedload(Influencer.influencer_categories).joinedload(
                InfluencerCategory.category
            )
        )
        .filter(Influencer.influencer_id == influencer_id)

        # ✅ 일반 사용자 상세 조회에서도 제외 계정 숨김
        .filter(Influencer.is_active.is_(True))

        .first()
    )

    if influencer is None:
        return None

    return influencer_to_response(influencer)

def create_influencer_posts(db: Session, influencer_id: int, posts_data: list):
    """게시물 목록을 DB에 저장 (upload_db의 build_db 로직)"""
    for p in posts_data:
        # 기존에 이미 있는 게시물인지 확인 (중복 방지)
        exists = db.query(InfluencerPost).filter(InfluencerPost.post_id == p.get('id')).first()
        if not exists:
            new_post = InfluencerPost(
                post_id=p.get('id'),
                influencer_id=influencer_id,
                post_type=p.get('type'),
                caption=p.get('caption'),
                likes_count=p.get('likesCount', 0),
                comments_count=p.get('commentsCount', 0),
                posted_at=pd.to_datetime(p.get('timestamp')),
                post_url=p.get('url'),
                display_url=p.get('displayUrl'),
                hashtags_json=p.get('hashtags'),
                mentions_json=p.get('mentions'),
            )
            db.add(new_post)

def create_related_relations(db: Session, source_id: int, related_usernames: list):
    """연관 계정 관계 저장 (related_db.json 로직)"""
    for r_username in related_usernames:
        # 연관된 유저가 이미 우리 influencer 테이블에 있는지 확인
        target = db.query(Influencer).filter(Influencer.username == r_username).first()
        if target:
            # 관계 저장 (이미 있으면 무시)
            exists = db.query(InfluencerRelated).filter(
                InfluencerRelated.source_influencer_id == source_id,
                InfluencerRelated.related_influencer_id == target.influencer_id
            ).first()
            if not exists:
                db.add(InfluencerRelated(
                    source_influencer_id=source_id,
                    related_influencer_id=target.influencer_id
                ))