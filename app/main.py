from fastapi import FastAPI

from app.db.database import Base, engine
from app.routers import category, influencer, mall_input, recommendation, user_action_log, favorite

app = FastAPI()

Base.metadata.create_all(bind=engine)

app.include_router(category.router)
app.include_router(influencer.router)
app.include_router(mall_input.router)
app.include_router(recommendation.router)
app.include_router(user_action_log.router)
app.include_router(favorite.router)


@app.get("/")
def root():
    return {"message": "ok"}