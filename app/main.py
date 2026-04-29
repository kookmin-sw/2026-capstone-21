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
    auth
)

app = FastAPI(root_path="/proxy/8000")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# DB 테이블 생성
Base.metadata.create_all(bind=engine)

# 라우터 등록
app.include_router(category.router)
app.include_router(auth.router)
app.include_router(influencer.router)
app.include_router(mall_input.router)
app.include_router(recommendation.router)
app.include_router(user_action_log.router)
app.include_router(favorite.router)
app.include_router(insight.router)
app.include_router(admin.router)


@app.get("/")
def root():
    return {"message": "ok"}