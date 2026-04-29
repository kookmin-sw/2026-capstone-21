from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.crud import recommendation as crud_recommendation
from app.db.database import get_db
from app.schemas.recommendation import (
    RecommendationRunCreate,
    RecommendationRunResponse,
    RecommendationResultCreate,
    RecommendationResultResponse,
)
from app.services.recommendation import RecommendationEngine
from typing import Optional, List

router = APIRouter(prefix="/recommendations", tags=["Recommendation"])

@router.get("/search", response_model=List[RecommendationResponse])
def search_recommendations(
    # 검색어 (Mall Input의 input_text)
    q: str = Query(..., description="검색어 (브랜드 무드 또는 키워드)"),
    # 필터링 조건들
    category: Optional[str] = Query(None, description="카테고리 필터"),
    minFollowers: Optional[int] = Query(None, description="최소 팔로워 수"),
    db: Session = Depends(get_db)
):
    """
    사용자의 검색어(input_text)를 기반으로 추천된 결과 내에서 
    카테고리, 팔로워 수 등으로 필터링을 수행합니다.
    """
    
    # 1. 먼저 검색어(q)와 유사한 mall_input을 찾거나, 
    #    해당 검색어를 기반으로 인플루언서 테이블에서 텍스트 검색(LIKE)을 수행합니다.
    query = db.query(Influencer).join(RecommendationResult) # 추천 결과와 조인
    
    # 2. 검색어 필터링 (인플루언서 자기소개나 유저 인풋 텍스트 기준)
    if q:
        query = query.filter(Influencer.biography.contains(q))
    
    # 3. 추가 조건 필터링
    if category:
        query = query.join(InfluencerCategory).filter(InfluencerCategory.category_name == category)
    
    if minFollowers:
        query = query.filter(Influencer.followers_count >= minFollowers)

    results = query.all()
    return results

@router.post("/runs", response_model=RecommendationRunResponse)
def create_recommendation_run(input_id: int, user_id: int, db: Session = Depends(get_db)):
    # 1. 유저의 인풋 텍스트 가져오기
    mall_input = db.query(MallInput).filter(MallInput.input_id == input_id).first()
    
    # 2. 추천 엔진 가동
    engine = RecommendationEngine(db)
    # Bandit이 결정한 가중치로 추천 결과(top 5) 생성
    recommendations = engine.recommend(user_id, mall_input.input_text, top_k=5)

    # 3. RecommendationRun 기록 (어떤 action_idx가 쓰였는지 기록하는 게 핵심!)
    new_run = RecommendationRun(
        input_id=input_id, 
        user_id=user_id,
        applied_action_idx=recommendations[0]['action_idx'] # Bandit의 선택 기록
    )
    db.add(new_run)
    db.commit()
    db.refresh(new_run)

    # 4. 개별 인플루언서 결과 저장
    for rec in recommendations:
        result_entry = RecommendationResult(
            run_id=new_run.run_id,
            influencer_id=rec['influencer_id'],
            score=rec['score'],
            rank_no=recommendations.index(rec) + 1
        )
        db.add(result_entry)
    
    db.commit()
    return {"run_id": new_run.run_id, "recommendations": recommendations}
