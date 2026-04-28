from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.crawler import CrawlerService
from app.services.build_influencer_embeddings import build_embeddings # GPU 작업

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.post("/sync-all")
async def sync_all_data(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # [수집 -> 분류 -> GPU 임베딩] 통합 파이프라인 실행
    def integrated_task():
        # 1. 크롤링
        crawler = CrawlerService(db)
        crawler.run_full_crawl_pipeline()
        
        # 2. AI 분류 (생략 가능하거나 추가 가능)
        
        # 3. GPU 임베딩 (build_embeddings 함수 실행)
        build_embeddings() # 내부적으로 SessionLocal()을 쓰므로 그대로 호출 가능

    background_tasks.add_task(integrated_task)
    return {"message": "전체 데이터 동기화 및 GPU 임베딩 작업이 시작되었습니다."}