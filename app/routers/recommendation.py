from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.crud import recommendation as crud_recommendation
from app.db.database import get_db
from app.schemas.recommendation import (
    RecommendationRunCreate,
    RecommendationRunResponse,
    RecommendationResultCreate,
    RecommendationResultResponse,
)

router = APIRouter(prefix="/recommendations", tags=["Recommendation"])


@router.post("/runs", response_model=RecommendationRunResponse)
def create_run(data: RecommendationRunCreate, db: Session = Depends(get_db)):
    return crud_recommendation.create_recommendation_run(db, data)


@router.get("/runs", response_model=list[RecommendationRunResponse])
def get_runs(db: Session = Depends(get_db)):
    return crud_recommendation.get_recommendation_runs(db)


@router.post("/results", response_model=RecommendationResultResponse)
def create_result(data: RecommendationResultCreate, db: Session = Depends(get_db)):
    return crud_recommendation.create_recommendation_result(db, data)


@router.get("/results", response_model=list[RecommendationResultResponse])
def get_results(db: Session = Depends(get_db)):
    return crud_recommendation.get_recommendation_results(db)

@router.post("/predict")
def predict_recommendations(data: RecommendationRunCreate, db: Session = Depends(get_db)):
    engine = RecommendationEngine(db)
    # MallInput에서 input_text 가져오기 (가정)
    from app.db.models import MallInput
    mall_input = db.query(MallInput).filter(MallInput.input_id == data.input_id).first()
    
    predictions = engine.recommend(user_id=data.user_id, query_text=mall_input.input_text)
    
    # 결과를 RecommendationResult 테이블에 저장하는 로직 추가 가능
    return predictions