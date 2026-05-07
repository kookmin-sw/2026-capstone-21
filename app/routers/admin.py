from __future__ import annotations
from typing import Optional, Union, List, Dict
from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from openai import OpenAI
import os

from app.db.database import get_db, SessionLocal
from app.db.models import (
    Influencer,
    InfluencerCategory,
    Category,
    InfluencerPost,
)
from app.services.crawler import CrawlerService
from app.services.classify import run_db_classification
from app.services.build_influencer_embeddings import build_embeddings

from pydantic import BaseModel
from typing import List, Optional


router = APIRouter(prefix="/admin", tags=["Admin"])


class KeywordCrawlRequest(BaseModel):
    keywords: List[str]
    max_results: Optional[int] = 50
    min_followers: Optional[int] = 1000
    min_posts: Optional[int] = 30
    follow_ratio: Optional[float] = 0.5
    engagement_rate: Optional[float] = 0.01
    last_post_date: Optional[str] = None


@router.post("/sync-all")
async def sync_all_data(background_tasks: BackgroundTasks):
    def integrated_task():
        db = SessionLocal()
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

        try:
            crawler = CrawlerService(db)
            crawler.run_full_crawl_pipeline()
            db.flush()

            run_db_classification(db, client, example_bank_path="data/example_bank.json")
            db.flush()

            build_embeddings(db)
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"동기화 중 에러 발생: {e}")
        finally:
            db.close()

    background_tasks.add_task(integrated_task)
    return {"message": "전체 데이터 동기화 및 임베딩 작업이 시작되었습니다."}


@router.post("/crawl-by-keywords")
async def crawl_by_keywords(payload: KeywordCrawlRequest, background_tasks: BackgroundTasks):
    def targeted_task():
        db = SessionLocal()

        try:
            crawler = CrawlerService(db)

            cnt = crawler.run_targeted_crawl(
                base_seeds=payload.keywords,
                filters={
                    "max_results": payload.max_results,
                    "min_followers": payload.min_followers,
                    "min_posts": payload.min_posts,
                    "follow_ratio": payload.follow_ratio,
                    "engagement_rate": payload.engagement_rate,
                    "last_post_date": payload.last_post_date,
                },
            )

            try:
                build_embeddings(db)
            except TypeError:
                build_embeddings()

            db.commit()
            print(f"✅ {cnt}명 크롤링 및 임베딩 갱신 완료")

        except Exception as e:
            db.rollback()
            print(f"키워드 기반 크롤링 중 에러 발생: {e}")
        finally:
            db.close()

    background_tasks.add_task(targeted_task)

    return {
        "message": f"키워드 {payload.keywords} 기반 크롤링이 시작되었습니다."
    }


@router.delete("/influencers/{influencer_id}")
def delete_influencer(influencer_id: int, db: Session = Depends(get_db)):
    influencer = (
        db.query(Influencer)
        .filter(Influencer.influencer_id == influencer_id)
        .first()
    )

    if not influencer:
        raise HTTPException(status_code=404, detail="인플루언서를 찾을 수 없습니다.")

    username = influencer.username

    try:
        db.delete(influencer)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"인플루언서 삭제 중 오류가 발생했습니다: {e}",
        )

    return {
        "message": f"인플루언서 ID {influencer_id}({username}) 삭제 완료"
    }


@router.get("/stats")
def get_db_stats(db: Session = Depends(get_db)):
    count = db.query(Influencer).count()

    return {"total_influencers": count}


@router.get("/search-influencers")
def search_influencers_for_admin(
    keywords: Optional[str] = None,
    min_followers: Optional[int] = None,
    min_posts: Optional[int] = None,
    last_post_date: Optional[str] = None,
    db: Session = Depends(get_db),
):
    last_post_subquery = (
        db.query(
            InfluencerPost.influencer_id.label("influencer_id"),
            func.max(InfluencerPost.posted_at).label("last_post_date"),
        )
        .group_by(InfluencerPost.influencer_id)
        .subquery()
    )

    query = (
        db.query(
            Influencer,
            Category.category_name.label("category_name"),
            last_post_subquery.c.last_post_date,
        )
        .outerjoin(
            InfluencerCategory,
            Influencer.influencer_id == InfluencerCategory.influencer_id,
        )
        .outerjoin(
            Category,
            InfluencerCategory.category_id == Category.category_id,
        )
        .outerjoin(
            last_post_subquery,
            Influencer.influencer_id == last_post_subquery.c.influencer_id,
        )
    )

    if keywords:
        keyword_list = [
            keyword.strip()
            for keyword in keywords.split(",")
            if keyword.strip()
        ]

        if keyword_list:
            keyword_filters = []

            for keyword in keyword_list:
                like_keyword = f"%{keyword}%"

                keyword_filters.append(Influencer.username.ilike(like_keyword))
                keyword_filters.append(Influencer.full_name.ilike(like_keyword))
                keyword_filters.append(Influencer.style_keywords_text.ilike(like_keyword))
                keyword_filters.append(Category.category_name.ilike(like_keyword))

            query = query.filter(or_(*keyword_filters))

    if min_followers is not None:
        query = query.filter(Influencer.followers_count >= min_followers)

    if min_posts is not None:
        query = query.filter(Influencer.posts_count >= min_posts)

    if last_post_date:
        query = query.filter(
            func.date(last_post_subquery.c.last_post_date) >= last_post_date
        )

    rows = query.order_by(Influencer.followers_count.desc()).all()

    results = []
    seen_ids = set()

    for influencer, category_name, last_post in rows:
        if influencer.influencer_id in seen_ids:
            continue

        seen_ids.add(influencer.influencer_id)

        # ✅ 수정: 관리자용 표시 로직
        if influencer.is_active is False:
            display_category = "제외"
        elif category_name:
            display_category = category_name
        else:
            display_category = "미분류"

        results.append(
            {
                "influencer_id": influencer.influencer_id,
                "username": influencer.username,
                "full_name": influencer.full_name,
                "profile_pic_url": influencer.profile_pic_url,
                "followers_count": influencer.followers_count or 0,
                "posts_count": influencer.posts_count or 0,
                "category": display_category,
                "last_post_date": last_post.isoformat() if last_post else None,
                "style_keywords_text": influencer.style_keywords_text,
                "is_active": influencer.is_active,
            }
        )

    return results
