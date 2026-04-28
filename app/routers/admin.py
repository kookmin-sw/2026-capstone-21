from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Influencer
from app.services.crawler import CrawlerService
from app.services.build_influencer_embeddings import build_embeddings
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/admin", tags=["Admin"])

# 키워드 크롤링을 위한 스키마
class KeywordCrawlRequest(BaseModel):
    keywords: List[str]

@router.post("/sync-all")
async def sync_all_data(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """기존 통합 파이프라인"""
    def integrated_task():
        crawler = CrawlerService(db)
        crawler.run_full_crawl_pipeline()
        # 여기서 AI 분류(classify) 로직을 호출할 수 있습니다.
        build_embeddings()

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