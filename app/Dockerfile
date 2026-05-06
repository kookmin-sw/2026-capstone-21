# 1. 파이썬 환경 설정
FROM python:3.9-slim

# 2. 필수 시스템 패키지 설치 (LightFM 빌드용 GCC 등)
RUN apt-get update && apt-get install -y \
    build-essential \
    python3-dev \
    libssl-dev \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir -U pip
RUN pip install --no-cache-dir -r requirements.txt

# 3. 작업 디렉토리 생성
WORKDIR /app

# 4. 의존성 설치 (캐시 활용을 위해 먼저 복사)
COPY requirements.txt .
RUN pip install --no-cache-dir -U pip && \
    pip install --no-cache-dir -r requirements.txt

# 5. 전체 소스 코드 및 인증서 복사
COPY . .

# 6. 스크립트 실행 권한 부여
RUN chmod +x setup_project.sh

# 7. 포트 개방
EXPOSE 8000

# 8. 실행 (도커 실행 시 setup_project.sh가 아닌 서버를 직접 띄우는 것이 정석입니다)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]