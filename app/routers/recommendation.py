from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.db.database import get_db
from app.db.models import MallInput, RecommendationRun, RecommendationResult, Influencer, InfluencerCategory, Category
from app.schemas.recommendation import RecommendationRunResponse, RealtimeRequest
from app.services.recommendation import RecommendationEngine

router = APIRouter(prefix="/recommendations", tags=["Recommendation"])

# 전역 변수 혹은 의존성 주입으로 엔진을 관리하여 성능 최적화 필요 (싱글톤 권장)
# 여기서는 간단하게 로직 통합에 집중합니다.

@router.post("/predict", response_model=RecommendationRunResponse)
def get_and_save_recommendations(
    input_id: int, 
    user_id: int, 
    category: Optional[str] = Query(None),
    minFollowers: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """
    브랜드 입력 정보를 바탕으로 실시간 추천을 생성하고, 
    필터 조건에 맞는 최종 결과를 즉시 반환합니다.
    """
    
    # 1. 입력 데이터 존재 확인
    mall_input = db.query(MallInput).filter(MallInput.input_id == input_id).first()
    if not mall_input:
        raise HTTPException(status_code=404, detail="입력 정보를 찾을 수 없습니다.")

    # 2. 추천 엔진 가동 (주의: 실제 서비스에서는 엔진 객체를 미리 생성해둬야 함)
    engine = RecommendationEngine(db)
    recommendations = engine.recommend(user_id, mall_input.input_text, top_k=20) # 넉넉히 추출

    if not recommendations:
        return {"run_id": 0, "recommendations": []}

    # 3. RecommendationRun (기록) 생성
    new_run = RecommendationRun(
        input_id=input_id, 
        user_id=user_id,
        applied_action_idx=recommendations[0]['action_idx'], # Bandit의 선택 기록
        status="completed"
    )
    db.add(new_run)
    db.flush() # ID 생성을 위해 flush

    # 4. 결과 저장 및 필터링 로직 통합
    final_results = []
    for idx, rec in enumerate(recommendations):
        # DB 저장용 객체 생성
        result_entry = RecommendationResult(
            run_id=new_run.run_id,
            influencer_id=rec['influencer_id'],
            final_score=rec['score'],
            rank_no=idx + 1
        )
        db.add(result_entry)
        
        # 필터링 조건 체크 (메모리 내 필터링으로 성능 향상)
        inf = db.query(Influencer).filter(Influencer.influencer_id == rec['influencer_id']).first()
        
        if category:
            # 카테고리 체크 로직 (InfluencerCategory 모델 참조)
            cat_exists = db.query(InfluencerCategory).filter(
                InfluencerCategory.influencer_id == inf.influencer_id,
                InfluencerCategory.priority == 1
            ).join(Category).filter(Category.category_name == category).first()
            if not cat_exists: continue
            
        if minFollowers and (inf.followers_count or 0) < minFollowers:
            continue
            
        final_results.append({
            "influencer_id": inf.influencer_id,
            "username": inf.username,
            "score": rec['score'],
            "rank_no": idx + 1
        })

    db.commit()
    
    return {
        "run_id": new_run.run_id,
        "recommendations": final_results[:5] # 최종적으로 상위 5개만 반환
    }

# realtime api 추가
@router.post("/realtime")
def realtime_recommend(
    request: RealtimeRequest,
    db: Session = Depends(get_db)
):

    text = request.text
    user_id = request.user_id
    category = request.category
    minFollowers = request.minFollowers

    engine = RecommendationEngine(db)

    recommendations = engine.recommend(
        user_id,
        text,
        top_k=20
    )

    if not recommendations:
        return {"run_id": None, "recommendations": []}

    final_results = []
    rank = 1

    for rec in recommendations:

        inf = db.query(Influencer).filter(
            Influencer.influencer_id == rec["influencer_id"]
        ).first()

        if not inf:
            continue

        # category filter
        if category:
            cat_exists = db.query(InfluencerCategory).join(Category).filter(
                InfluencerCategory.influencer_id == inf.influencer_id,
                InfluencerCategory.priority == 1,
                Category.category_name == category
            ).first()

            if not cat_exists:
                continue

        # follower filter
        if minFollowers and (inf.followers_count or 0) < minFollowers:
            continue

        final_results.append({
            "influencer_id": inf.influencer_id,
            "username": inf.username,
            "score": rec["score"],
            "rank_no": rank
        })

        rank += 1

    return {
        "run_id": None,
        "recommendations": final_results[:5]
    }