from __future__ import annotations
from typing import Optional, Union, List, Dict
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

@router.get("/history/{user_id}")
def get_recommendation_history(user_id: int, db: Session = Depends(get_db)):
    """유저의 추천 기록 목록 조회"""
    runs = (
        db.query(RecommendationRun)
        .filter(RecommendationRun.user_id == user_id)
        .order_by(RecommendationRun.requested_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "run_id": r.run_id,
            "input_text": r.mall_input.input_text if r.mall_input else None,
            "status": r.status,
            "requested_at": r.requested_at,
            "result_count": len(r.results),
        }
        for r in runs
    ]


@router.get("/{run_id}")
def get_recommendation_detail(
    run_id: int,
    user_id: int = Query(...),
    db: Session = Depends(get_db),
):
    """추천 결과 상세 조회 - user는 자기 추천만 접근 가능"""
    run = db.query(RecommendationRun).filter(RecommendationRun.run_id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="추천 결과를 찾을 수 없습니다.")

    from app.db.models import User
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="유저를 찾을 수 없습니다.")
    if user.role != "admin" and run.user_id != user_id:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다.")

    results = (
        db.query(RecommendationResult)
        .filter(RecommendationResult.run_id == run_id)
        .order_by(RecommendationResult.rank_no)
        .all()
    )

    recommendations = []
    for r in results:
        inf = db.query(Influencer).filter(Influencer.influencer_id == r.influencer_id).first()
        cat = db.query(Category).join(InfluencerCategory).filter(
            InfluencerCategory.influencer_id == r.influencer_id,
            InfluencerCategory.priority == 1,
        ).first()
        recommendations.append({
            "rank_no": r.rank_no,
            "influencer_id": r.influencer_id,
            "username": inf.username if inf else None,
            "full_name": inf.full_name if inf else None,
            "profile_pic_url": inf.profile_pic_url if inf else None,
            "followers_count": inf.followers_count if inf else 0,
            "category": cat.category_name if cat else None,
            "grade_score": inf.grade_score if inf else None,
            "final_score": r.final_score,
            "similarity_score": r.similarity_score,
            "personalization_score": r.personalization_score,
        })

    return {
        "run_id": run.run_id,
        "user_id": run.user_id,
        "input_id": run.input_id,
        "status": run.status,
        "requested_at": run.requested_at,
        "input_text": run.mall_input.input_text if run.mall_input else None,
        "recommendations": recommendations,
    }


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