from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import Base, engine
from app.routers import (
    category,
    influencer,
    mall_input,
    recommendation,
    user_action_log,
    favorite,
    insight,
    admin,
    auth,
    chatwoot
)

app = FastAPI(root_path="/proxy/8000")

# CORS 설정 (ngrok / Chatwoot용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(category.router)
app.include_router(auth.router)
app.include_router(influencer.router)
app.include_router(mall_input.router)
app.include_router(recommendation.router)
app.include_router(user_action_log.router)
app.include_router(favorite.router)
app.include_router(insight.router)
app.include_router(admin.router)
app.include_router(chatwoot.router)


@app.get("/")
def root():
    return {"message": "ok"}