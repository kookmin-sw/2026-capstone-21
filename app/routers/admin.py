from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session
from openai import OpenAI
import os

from app.db.database import get_db, SessionLocal
from app.db.models import Influencer

from app.services.crawler import CrawlerService
from app.services.classify import run_db_classification
from app.services.build_influencer_embeddings import build_embeddings

from pydantic import BaseModel
from typing import List

from typing import List, Optional
from sqlalchemy import func, or_
from app.db.models import Influencer, InfluencerCategory, Category, InfluencerPost

router = APIRouter(prefix="/admin", tags=["Admin"])

# 키워드 크롤링을 위한 스키마
class KeywordCrawlRequest(BaseModel):
    keywords: List[str]

@router.post("/sync-all")
async def sync_all_data(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """기존 통합 파이프라인"""
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
async def crawl_by_keywords(payload: KeywordCrawlRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """특정 키워드(해시태그) 기반으로 타겟팅 크롤링"""
    def targeted_task():
        crawler = CrawlerService(db)
        # crawler.py의 expand_seed 로직을 활용하도록 구성
        # 팁: CrawlerService 내부에 특정 키워드 리스트를 인자로 받는 메서드를 만드시면 좋습니다.
        crawler.run_targeted_crawl(payload.keywords)
        build_embeddings() # 새로운 데이터가 들어왔으니 임베딩 갱신

    background_tasks.add_task(targeted_task)
    return {"message": f"키워드 {payload.keywords} 기반 크롤링이 시작되었습니다."}

@router.delete("/influencers/{influencer_id}")
def delete_influencer(influencer_id: int, db: Session = Depends(get_db)):
    """부적절한 인플루언서 수동 삭제"""
    influencer = db.query(Influencer).filter(Influencer.influencer_id == influencer_id).first()
    if not influencer:
        raise HTTPException(status_code=404, detail="인플루언서를 찾을 수 없습니다.")
    
    db.delete(influencer)
    db.commit()
    return {"message": f"인플루언서 ID {influencer_id}({influencer.username}) 삭제 완료"}

@router.get("/stats")
def get_db_stats(db: Session = Depends(get_db)):
    """현재 DB 상태 요약 (관리용)"""
    count = db.query(Influencer).count()
    return {"total_influencers": count}

@router.get("/search-influencers")
def search_influencers_for_admin(
    keywords: Optional[str] = None,
    min_followers: Optional[int] = None,
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
                keyword_filters.append(
                    Influencer.style_keywords_text.ilike(like_keyword)
                )
                keyword_filters.append(Category.category_name.ilike(like_keyword))

            query = query.filter(or_(*keyword_filters))

    if min_followers is not None:
        query = query.filter(Influencer.followers_count >= min_followers)

    if last_post_date:
        query = query.filter(
            func.date(last_post_subquery.c.last_post_date) >= last_post_date
        )

    rows = (
        query
        .order_by(Influencer.followers_count.desc())
        .all()
    )

    results = []

    seen_ids = set()

    for influencer, category_name, last_post in rows:
        if influencer.influencer_id in seen_ids:
            continue

        seen_ids.add(influencer.influencer_id)

        results.append(
            {
                "influencer_id": influencer.influencer_id,
                "username": influencer.username,
                "full_name": influencer.full_name,
                "profile_pic_url": influencer.profile_pic_url,
                "followers_count": influencer.followers_count or 0,
                "posts_count": influencer.posts_count or 0,
                "category": category_name or "기타",
                "last_post_date": last_post.isoformat() if last_post else None,
                "style_keywords_text": influencer.style_keywords_text,
            }
        )

    return results
