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
    chatwoot  # 1. 주석 해제
)

app = FastAPI(root_path="/proxy/8000")

# 2. CORS 설정 최적화
app.add_middleware(
    CORSMiddleware,
    # 1. 허용할 도메인들
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "https://voting-tightrope-landlady.ngrok-free.dev",
        "https://yanking-size-triangle.ngrok-free.dev",
        "*" # 테스트 중에는 모든 도메인 허용을 추가하는 것이 가장 안전합니다.
    ],
    allow_credentials=True,
    allow_methods=["*"],
    
    allow_headers=["*", "ngrok-skip-browser-warning"],
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
app.include_router(chatwoot.router) # 3. 주석 해제


@app.get("/")
def root():
    return {"message": "ok"}

