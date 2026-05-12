from __future__ import annotations
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import Base, engine, SessionLocal
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
from app.services.recommendation import update_global_lfm_model

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. 서버 시작 시 LFM 모델 초기화
    db = SessionLocal()
    try:
        update_global_lfm_model(db)
        print("✅ Global LFM Model loaded successfully.")
    except Exception as e:
        print(f"❌ Failed to load LFM Model: {e}")
    finally:
        db.close()
    
    yield

app = FastAPI(root_path="/proxy/8000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    
    allow_headers=["*"],
    expose_headers=["*"],
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

from app.routers import chat
app.include_router(chat.router)

@app.get("/")
def root():
    return {"message": "ok"}

