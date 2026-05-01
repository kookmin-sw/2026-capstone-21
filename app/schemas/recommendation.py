from typing import Optional, List
from pydantic import BaseModel


class RecommendationRunCreate(BaseModel):
    user_id: int
    input_id: int


class RecommendationItemResponse(BaseModel):
    influencer_id: int
    username: str
    score: float
    rank_no: int


class RecommendationRunResponse(BaseModel):
    run_id: int
    user_id: Optional[int] = None
    input_id: Optional[int] = None
    status: Optional[str] = None
    error_message: Optional[str] = None
    recommendations: List[RecommendationItemResponse] = []

    class Config:
        from_attributes = True


class RecommendationResultCreate(BaseModel):
    run_id: int
    influencer_id: int
    similarity_score: Optional[float] = None
    grade_score: Optional[float] = None
    personalization_score: Optional[float] = None
    final_score: float
    rank_no: int


class RecommendationResultResponse(BaseModel):
    result_id: int
    run_id: int
    influencer_id: int
    similarity_score: Optional[float] = None
    grade_score: Optional[float] = None
    personalization_score: Optional[float] = None
    final_score: float
    rank_no: int

    class Config:
        from_attributes = True