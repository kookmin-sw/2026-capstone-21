import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # 프로젝트 기본 정보
    PROJECT_NAME: str = "Capstone Influencer Recommendation"
    
    # DB 설정 
    PICKPLE_DATABASE_URL: str = os.getenv("PICKPLE_DATABASE_URL")
    
    # JWT 보안 설정
    # openssl rand -hex 32 명령어로 생성한 문자열을 넣는 것이 좋습니다.
    SECRET_KEY: str = os.getenv("SECRET_KEY")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1일

    # AI 모델 설정
    EMBEDDING_MODEL: str = "BAAI/bge-m3"

    
    class Config:
        case_sensitive = True

# 어디서든 import settings로 쓸 수 있게 인스턴스 생성
settings = Settings()