from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud import influencer as crud_influencer
from app.db.database import get_db
from app.schemas.influencer import InfluencerResponse

router = APIRouter(prefix="/influencers", tags=["Influencer"])


@router.get("/", response_model=list[InfluencerResponse])
def get_influencers(db: Session = Depends(get_db)):
    return crud_influencer.get_influencers(db)


@router.get("/{influencer_id}", response_model=InfluencerResponse)
def get_influencer(influencer_id: int, db: Session = Depends(get_db)):
    influencer = crud_influencer.get_influencer_by_id(db, influencer_id)
    if not influencer:
        raise HTTPException(status_code=404, detail="Influencer not found")
    return influencer