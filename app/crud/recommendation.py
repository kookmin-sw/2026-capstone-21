from __future__ import annotations
from typing import Optional, Union, List, Dict
from sqlalchemy.orm import Session

from app.db.models import (
    RecommendationRun,
    RecommendationResult,
)


def create_recommendation_run(db: Session, data):
    run = RecommendationRun(
        user_id=data.user_id,
        input_id=data.input_id,
        status="pending",
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    return run


def get_recommendation_runs(db: Session):
    return db.query(RecommendationRun).order_by(RecommendationRun.run_id.asc()).all()


def create_recommendation_result(db: Session, data):
    result = RecommendationResult(
        run_id=data.run_id,
        influencer_id=data.influencer_id,
        similarity_score=data.similarity_score,
        grade_score=data.grade_score,
        personalization_score=data.personalization_score,
        final_score=data.final_score,
        rank_no=data.rank_no,
    )
    db.add(result)
    db.commit()
    db.refresh(result)
    return result


def get_recommendation_results(db: Session):
    return db.query(RecommendationResult).order_by(RecommendationResult.result_id.asc()).all()