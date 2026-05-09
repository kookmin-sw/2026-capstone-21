from __future__ import annotations
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

APP_DIR = Path(__file__).resolve().parents[1]
PROJECT_DIR = Path(__file__).resolve().parents[2]

for env_path in (PROJECT_DIR / ".env", APP_DIR / ".env"):
    if env_path.exists():
        load_dotenv(env_path, override=False)

class Settings(BaseSettings):
    # 프로젝트 기본 정보
    PROJECT_NAME: str = "Capstone Influencer Recommendation"
    
    # DB 설정 
    PICKPLE_DATABASE_URL: str
    
    # JWT 보안 설정
    # openssl rand -hex 32 명령어로 생성한 문자열을 넣는 것이 좋습니다.
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1일

    # AI 모델 설정
    EMBEDDING_MODEL: str = "BAAI/bge-m3"
    OPENAI_API_KEY: Optional[str] = None
    API_TOKEN: Optional[str] = None

    AWS_ACCESS_KEY: str
    AWS_SECRET_KEY: str
    AWS_REGION: str = "ap-northeast-2" # 기본값 서울 리전
    BUCKET_NAME: str

    # Chatwoot 설정
    CHATWOOT_BASE_URL: Optional[str] = None
    API_ACCESS_TOKEN: Optional[str] = None
    CHATWOOT_PORTAL_ID: Optional[str] = None
    CHATWOOT_HELP_CENTER_ARTICLES_URL: Optional[str] = None
    
    model_config = SettingsConfigDict(
        env_file=(PROJECT_DIR / ".env", APP_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )

# 어디서든 import settings로 쓸 수 있게 인스턴스 생성
settings = Settings()
