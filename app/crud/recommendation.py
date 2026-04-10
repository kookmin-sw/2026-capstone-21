from sqlalchemy.orm import Session

from app.db.models import (
    RecommendationRun,
    RecommendationResult,
    RecommendationResultSelection,
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


def create_recommendation_result_selection(db: Session, data):
    selection = RecommendationResultSelection(
        user_id=data.user_id,
        result_id=data.result_id,
    )
    db.add(selection)
    db.commit()
    db.refresh(selection)
    return selection


def get_recommendation_result_selections(db: Session):
    return (
        db.query(RecommendationResultSelection)
        .order_by(RecommendationResultSelection.selection_id.asc())
        .all()
    )