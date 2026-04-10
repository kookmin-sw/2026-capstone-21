from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.crud import category as crud_category
from app.db.database import get_db
from app.schemas.category import CategoryResponse

router = APIRouter(prefix="/categories", tags=["Category"])


@router.get("/", response_model=list[CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    return crud_category.get_categories(db)