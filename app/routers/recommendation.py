from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.db.database import get_db
from app.db.models import MallInput, RecommendationRun, RecommendationResult, Influencer, InfluencerCategory, Category
from app.schemas.recommendation import RecommendationRunResponse
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
    recommendations = engine.recommend(user_id, mall_input.input_text, top_k=400)  # 넉넉히 추출 (기존 20 → 50)

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

    # 4. 결과 필터링 후 저장 (핵심 수정 부분)
    final_results = []
    save_rank = 1  # 필터 이후 순위 따로 관리

    for rec in recommendations:
        # 인플루언서 조회
        inf = db.query(Influencer).filter(
            Influencer.influencer_id == rec['influencer_id']
        ).first()

        if not inf:
            continue

        # 카테고리 필터
        if category:
            cat_exists = db.query(InfluencerCategory).filter(
                InfluencerCategory.influencer_id == inf.influencer_id,
                InfluencerCategory.priority == 1
            ).join(Category).filter(Category.category_name == category).first()

            if not cat_exists:
                continue

        # 팔로워 수 필터
        if minFollowers is not None and (inf.followers_count or 0) < minFollowers:
            continue

        # 👉 필터 통과한 경우만 저장
        result_entry = RecommendationResult(
            run_id=new_run.run_id,
            influencer_id=rec["influencer_id"],
            similarity_score=rec.get("similarity_score"),
            grade_score=rec.get("grade_score"),
            personalization_score=rec.get("personalization_score"),
            final_score=rec["score"],
            rank_no=save_rank
        )
        db.add(result_entry)

        final_results.append({
            "influencer_id": inf.influencer_id,
            "username": inf.username,
            "score": rec['score'],
            "rank_no": save_rank
        })

        save_rank += 1

        # 👉 최대 20개까지만 저장
        if len(final_results) == 20:
            break

    db.commit()
    
    return {
        "run_id": new_run.run_id,
        "user_id": user_id,
        "input_id": input_id,
        "status": "completed",
        "error_message": None,
        "recommendations": final_results
    }