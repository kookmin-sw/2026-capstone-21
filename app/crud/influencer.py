from sqlalchemy.orm import Session

from app.db.models import Influencer


def get_influencers(db: Session):
    return db.query(Influencer).order_by(Influencer.influencer_id.asc()).all()


def get_influencer_by_id(db: Session, influencer_id: int):
    return (
        db.query(Influencer)
        .filter(Influencer.influencer_id == influencer_id)
        .first()
    )