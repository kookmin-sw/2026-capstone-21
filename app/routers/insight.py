from typing import List, Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.crud import insight as crud_insight
from app.schemas.insight import (
    TotalCountResponse,
    TopPerformerResponse,
    DailyTrendResponse,
    CategoryDistributionResponse,
    CompareInfluencerResponse,
)


router = APIRouter(prefix="/insights", tags=["Insights"])


@router.get("/total-selections", response_model=TotalCountResponse)
def get_total_selections(db: Session = Depends(get_db)):
    total = crud_insight.get_total_selections(db)
    return {"total": total}


@router.get("/top-performer", response_model=Optional[TopPerformerResponse])
def get_top_performer(db: Session = Depends(get_db)):
    return crud_insight.get_top_performer(db)


@router.get("/total-influencers", response_model=TotalCountResponse)
def get_total_influencers(db: Session = Depends(get_db)):
    total = crud_insight.get_total_influencers(db)
    return {"total": total}


@router.get("/daily-trends", response_model=List[DailyTrendResponse])
def get_daily_trends(db: Session = Depends(get_db)):
    return crud_insight.get_daily_trends(db)


@router.get("/category-distribution", response_model=List[CategoryDistributionResponse])
def get_category_distribution(db: Session = Depends(get_db)):
    return crud_insight.get_category_distribution(db)


@router.get("/compare", response_model=List[CompareInfluencerResponse])
def compare_influencers(i1: int, i2: int, db: Session = Depends(get_db)):
    return crud_insight.compare_influencers(db, i1, i2)