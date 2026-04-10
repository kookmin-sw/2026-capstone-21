from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.crud import recommendation as crud_recommendation
from app.db.database import get_db
from app.schemas.recommendation import (
    RecommendationRunCreate,
    RecommendationRunResponse,
    RecommendationResultCreate,
    RecommendationResultResponse,
    RecommendationResultSelectionCreate,
    RecommendationResultSelectionResponse,
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


@router.post("/selections", response_model=RecommendationResultSelectionResponse)
def create_selection(data: RecommendationResultSelectionCreate, db: Session = Depends(get_db)):
    return crud_recommendation.create_recommendation_result_selection(db, data)


@router.get("/selections", response_model=list[RecommendationResultSelectionResponse])
def get_selections(db: Session = Depends(get_db)):
    return crud_recommendation.get_recommendation_result_selections(db)