from datetime import date, timedelta

from sqlalchemy import func, desc
from sqlalchemy.orm import Session

from app.db.models import (
    UserActionLog,
    Influencer,
    Category,
    InfluencerCategory,
)


SELECTION_ACTION = "favorite_add"


def get_total_selections(db: Session):
    return (
        db.query(func.count(UserActionLog.log_id))
        .filter(UserActionLog.action_type == SELECTION_ACTION)
        .scalar()
    )


def get_top_performer(db: Session):
    result = (
        db.query(
            UserActionLog.influencer_id,
            func.count(UserActionLog.log_id).label("selection_count"),
        )
        .filter(UserActionLog.action_type == SELECTION_ACTION)
        .group_by(UserActionLog.influencer_id)
        .order_by(desc("selection_count"))
        .first()
    )

    if not result:
        return None

    influencer = (
        db.query(Influencer)
        .filter(Influencer.influencer_id == result.influencer_id)
        .first()
    )

    if not influencer:
        return None

    return {
        "influencer_id": influencer.influencer_id,
        "username": influencer.username,
        "profile_url": influencer.profile_url,
        "followers_count": influencer.followers_count,
        "selection_count": result.selection_count,
    }


def get_total_influencers(db: Session):
    return db.query(func.count(Influencer.influencer_id)).scalar()


def get_daily_trends(db: Session):
    today = date.today()
    start_date = today - timedelta(days=6)

    results = (
        db.query(
            func.date(UserActionLog.created_at).label("date"),
            func.count(UserActionLog.log_id).label("count"),
        )
        .filter(UserActionLog.action_type == SELECTION_ACTION)
        .filter(func.date(UserActionLog.created_at) >= start_date)
        .group_by(func.date(UserActionLog.created_at))
        .order_by(func.date(UserActionLog.created_at))
        .all()
    )

    count_map = {str(r.date): r.count for r in results}

    return [
        {
            "date": str(start_date + timedelta(days=i)),
            "count": count_map.get(str(start_date + timedelta(days=i)), 0),
        }
        for i in range(7)
    ]


def get_category_distribution(db: Session):
    results = (
        db.query(
            Category.category_name,
            func.count(UserActionLog.log_id).label("count"),
        )
        .join(
            InfluencerCategory,
            Category.category_id == InfluencerCategory.category_id,
        )
        .join(
            Influencer,
            Influencer.influencer_id == InfluencerCategory.influencer_id,
        )
        .join(
            UserActionLog,
            UserActionLog.influencer_id == Influencer.influencer_id,
        )
        .filter(UserActionLog.action_type == SELECTION_ACTION)
        .filter(InfluencerCategory.priority == 1)
        .group_by(Category.category_name)
        .order_by(desc("count"))
        .all()
    )

    return [
        {
            "category_name": r.category_name,
            "count": r.count,
        }
        for r in results
    ]


def compare_influencers(db: Session, i1: int, i2: int):
    influencers = (
        db.query(Influencer)
        .filter(Influencer.influencer_id.in_([i1, i2]))
        .all()
    )

    return [
        {
            "influencer_id": influencer.influencer_id,
            "username": influencer.username,
            "profile_url": influencer.profile_url,
            "followers_count": influencer.followers_count,
            "posts_count": influencer.posts_count,
            "grade_score": influencer.grade_score,
            "categories": [
                ic.category.category_name
                for ic in influencer.influencer_categories
            ],
        }
        for influencer in influencers
    ]