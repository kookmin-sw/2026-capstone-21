from sqlalchemy.orm import Session, joinedload

from app.db.models import Influencer, InfluencerCategory


def get_primary_category(influencer: Influencer):
    for ic in influencer.influencer_categories:
        if ic.priority == 1 and ic.category:
            return ic.category.category_name

    return None


def influencer_to_response(influencer: Influencer):
    return {
        "influencer_id": influencer.influencer_id,
        "username": influencer.username,
        "profile_url": influencer.profile_url,
        "full_name": influencer.full_name,
        "external_url": influencer.external_url,
        "contact_email": influencer.contact_email,
        "followers_count": influencer.followers_count,
        "follows_count": influencer.follows_count,
        "posts_count": influencer.posts_count,
        "profile_pic_url": influencer.profile_pic_url,
        "account_type": influencer.account_type,
        "grade_score": influencer.grade_score,
        "style_keywords_json": influencer.style_keywords_json,
        "style_keywords_text": influencer.style_keywords_text,
        "primary_category": get_primary_category(influencer),
    }


def get_influencers(db: Session):
    influencers = (
        db.query(Influencer)
        .options(
            joinedload(Influencer.influencer_categories).joinedload(
                InfluencerCategory.category
            )
        )
        .order_by(Influencer.influencer_id.asc())
        .all()
    )

    return [influencer_to_response(influencer) for influencer in influencers]


def get_influencer_by_id(db: Session, influencer_id: int):
    influencer = (
        db.query(Influencer)
        .options(
            joinedload(Influencer.influencer_categories).joinedload(
                InfluencerCategory.category
            )
        )
        .filter(Influencer.influencer_id == influencer_id)
        .first()
    )

    if influencer is None:
        return None

    return influencer_to_response(influencer)