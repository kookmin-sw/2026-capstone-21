from sqlalchemy.orm import Session

from app.db.models import Category


def get_categories(db: Session):
    return db.query(Category).order_by(Category.category_id.asc()).all()