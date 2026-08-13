# Pickple 프로젝트 구조 및 코드 역할

## 1. 프로젝트 개요

Pickple은 쇼핑몰 정보를 입력받고, 인플루언서 데이터를 기반으로 적합한 인플루언서를 추천하는 웹 애플리케이션이다.

- 프론트엔드: React + TypeScript + Vite
- 백엔드: FastAPI + SQLAlchemy
- 데이터베이스: PostgreSQL 계열 DB 및 `pgvector` 사용 구조
- 추천 모델: LightFM 기반 추천 로직과 인플루언서 임베딩
- 외부 연동: Apify, OpenAI, Chatwoot, 기존 AWS S3/RDS
- 실행 방식: Docker Compose 또는 프론트엔드·백엔드 개별 실행

## 2. 전체 구조

```text
.
├─ app/                    # FastAPI 백엔드
│  ├─ crud/                # DB CRUD 함수
│  ├─ data/                # 초기 데이터, 이미지, 분석 결과
│  ├─ db/                  # DB 연결 및 ORM 모델
│  ├─ routers/             # HTTP API 엔드포인트
│  ├─ schemas/             # 요청·응답 데이터 형식
│  ├─ seed/                # 초기 데이터 입력 스크립트
│  ├─ services/            # 핵심 비즈니스 로직
│  ├─ utils/               # 설정·인증·공통 상수
│  ├─ main.py              # FastAPI 애플리케이션 시작점
│  ├─ requirements.txt     # Python 의존성
│  └─ Dockerfile           # 백엔드 이미지 정의
├─ frontend/               # React 프론트엔드
│  ├─ src/api/              # 백엔드 API 호출 함수
│  ├─ src/app/              # 화면, 상태, 라우팅, 타입
│  ├─ public/               # 정적 이미지
│  └─ Dockerfile            # 프론트엔드 빌드 및 Nginx 이미지 정의
├─ docker-compose.yml       # 전체 서비스 실행 설정
├─ global-bundle.pem        # PostgreSQL/RDS 연결용 CA 인증서
├─ init-letsencrypt.sh      # Let's Encrypt 인증서 초기화 스크립트
├─ benchmark_recommend.py   # 추천 결과 벤치마크 스크립트
├─ README.md                # 프로젝트 소개 및 기본 문서
├─ trouble.md               # 문제 해결 기록
└─ docs/                    # 발표 자료 및 정적 프로젝트 소개 페이지
```

`app/data/profile_pic_HD/`에는 대량의 인플루언서 프로필 이미지가 있으므로 위 구조도에서는 대표 디렉터리만 표시했다.

## 3. 백엔드 구조

### 3.1 시작점 및 설정

| 파일                            | 역할                                                                                         |
| ------------------------------- | -------------------------------------------------------------------------------------------- |
| `app/main.py`                 | FastAPI 앱을 생성하고 CORS, 라우터, DB 테이블 초기화, 추천 모델 로딩을 설정한다.             |
| `app/utils/setting_config.py` | 환경변수 기반 설정을 읽는다. DB URL, JWT, OpenAI, Apify, Chatwoot, AWS 설정이 정의되어 있다. |
| `app/utils/config.py`         | 추천 필터 기준과 Apify 클라이언트, 사용자 행동별 보상값을 정의한다.                          |
| `app/utils/auth.py`           | 비밀번호 검증, JWT 생성·검증 등 인증 기능을 담당한다.                                       |
| `app/requirements.txt`        | FastAPI, SQLAlchemy, PyTorch, LightFM, boto3, OpenAI 등 백엔드 패키지를 정의한다.            |

### 3.2 데이터베이스 계층

| 위치                   | 역할                                                                                    |
| ---------------------- | --------------------------------------------------------------------------------------- |
| `app/db/database.py` | SQLAlchemy 엔진과 세션을 만들고 API에서 사용할`get_db()`를 제공한다.                  |
| `app/db/models.py`   | 사용자, 인플루언서, 게시물, 관심 목록, 쇼핑몰 입력, 행동 로그 등의 ORM 모델을 정의한다. |
| `app/crud/*.py`      | 라우터가 DB에 직접 접근하지 않도록 생성·조회·수정·삭제 로직을 기능별로 분리한다.     |
| `app/schemas/*.py`   | Pydantic 요청·응답 모델이다. API 입력 검증과 응답 형식 정의에 사용된다.                |

### 3.3 API 라우터

| 파일                           | 주요 기능                                          |
| ------------------------------ | -------------------------------------------------- |
| `routers/auth.py`            | 회원가입, 로그인, 사용자 인증                      |
| `routers/influencer.py`      | 인플루언서 목록·상세 조회                         |
| `routers/recommendation.py`  | 추천 결과 조회 및 추천 이유 생성                   |
| `routers/category.py`        | 인플루언서 카테고리 조회                           |
| `routers/favorite.py`        | 인플루언서 즐겨찾기 등록·해제·조회               |
| `routers/mall_input.py`      | 쇼핑몰 URL/정보 입력 및 분석 요청                  |
| `routers/insight.py`         | 선택 수, 카테고리 분포, 기간별 통계 등 분석 데이터 |
| `routers/user_action_log.py` | 사용자 조회·선택·문의 등의 행동 기록             |
| `routers/admin.py`           | 관리자용 인플루언서 검색, 키워드 기반 크롤링 실행  |
| `routers/chat.py`            | 내부 추천 챗봇 API                                 |
| `routers/chatwoot.py`        | Chatwoot 대화·상담 이력 연동                      |

### 3.4 서비스 계층

| 파일                                        | 역할                                                                |
| ------------------------------------------- | ------------------------------------------------------------------- |
| `services/recommendation.py`              | 사용자 행동 로그를 활용한 LightFM 추천 모델 생성 및 추천 결과 계산  |
| `services/build_influencer_embeddings.py` | 인플루언서 카테고리와 스타일 키워드로 임베딩을 생성                 |
| `services/chatbot.py`                     | 추천·인플루언서·사이트 사용법 관련 자연어 응답 생성               |
| `services/mall_analyzer.py`               | 쇼핑몰 페이지를 조회하고 제목·설명·키워드 등의 정보를 분석        |
| `services/crawler.py`                     | Apify 기반 인플루언서 크롤링, 필터링, DB 저장, 프로필 이미지 업로드 |
| `services/classify.py`                    | 인플루언서 카테고리와 스타일 키워드 분류                            |
| `services/instagram_sync.py`              | 인스타그램 관련 데이터 동기화 보조 로직                             |
| `services/favorite.py`                    | 즐겨찾기 관련 서비스 로직                                           |
| `services/user_action_log.py`             | 사용자 행동 로그 처리                                               |

### 3.5 초기 데이터 및 분석 도구

| 위치                             | 역할                                                             |
| -------------------------------- | ---------------------------------------------------------------- |
| `app/seed/seed_users.py`       | 테스트 사용자 입력                                               |
| `app/seed/seed_categories.py`  | 카테고리 입력                                                    |
| `app/seed/seed_influencers.py` | JSON 인플루언서 데이터를 DB에 입력 또는 갱신                     |
| `app/seed/seed_logs.py`        | 추천용 사용자 행동 로그 입력                                     |
| `app/seed/seed_images.py`      | 프로필 이미지를 S3에 업로드하던 스크립트                         |
| `app/data/*.json`              | 인플루언서, 게시물, 분류 결과, 관련 데이터 등의 정적 원천 데이터 |
| `app/download_model.py`        | 임베딩 모델 사전 다운로드                                        |
| `benchmark_recommend.py`       | 추천 품질 및 성능 확인용 독립 스크립트                           |

## 4. 프론트엔드 구조

### 4.1 진입점과 상태

| 파일                                               | 역할                                  |
| -------------------------------------------------- | ------------------------------------- |
| `frontend/src/main.tsx`                          | React 앱의 브라우저 진입점            |
| `frontend/src/app/App.tsx`                       | 최상위 앱 컴포넌트                    |
| `frontend/src/app/routes.ts`                     | 화면 라우팅 정의                      |
| `frontend/src/app/context/AuthContext.tsx`       | 로그인 사용자와 인증 상태 관리        |
| `frontend/src/app/context/InfluencerContext.tsx` | 인플루언서 목록·선택 상태 관리       |
| `frontend/src/app/types/index.ts`                | 공통 TypeScript 타입                  |
| `frontend/src/app/data/selectionHistory.ts`      | 선택 이력 관련 프론트엔드 데이터 처리 |

### 4.2 API 호출 모듈

`frontend/src/api/`는 화면 컴포넌트가 백엔드 URL과 HTTP 세부사항을 직접 다루지 않도록 기능별 API 함수를 제공한다.

- `auth.ts`: 로그인·회원가입
- `influencer.ts`: 인플루언서 조회
- `recommendation.ts`: 추천 결과 요청
- `category.ts`: 카테고리 조회
- `mallInput.ts`: 쇼핑몰 입력
- `favorite.ts`: 즐겨찾기
- `insight.ts`: 통계·인사이트
- `userActionLog.ts`: 사용자 행동 로그
- `chatHistory.ts`: Chatwoot 대화 이력
- `admin.ts`: 관리자 검색·크롤링
- `client.ts`: 공통 `fetch` 래퍼

API 기본 주소는 빌드 환경변수 `VITE_API_BASE_URL`로 주입된다.

### 4.3 주요 화면 컴포넌트

| 파일                                                          | 역할                                             |
| ------------------------------------------------------------- | ------------------------------------------------ |
| `LandingPage.tsx`                                           | 비로그인 초기 화면                               |
| `LoginModal.tsx`, `SignupModal.tsx`                       | 로그인·회원가입 모달                            |
| `HomePage.tsx`                                              | 로그인 후 메인 화면                              |
| `RecommendPage.tsx`                                         | 조건별 인플루언서 추천 및 필터링                 |
| `RecommendationDetail.tsx`                                  | 추천 인플루언서 상세 정보                        |
| `InfluencerProfile.tsx`                                     | 인플루언서 목록·프로필                          |
| `InfluencerProfileModal.tsx`                                | 프로필 상세 모달                                 |
| `CompareInfluencers.tsx`                                    | 인플루언서 비교                                  |
| `MyPage.tsx`, `Profile.tsx`                               | 사용자 정보 및 마이페이지                        |
| `Dashboard.tsx`, `Analytics.tsx`, `StatisticsChart.tsx` | 통계와 분석 대시보드                             |
| `InterestList.tsx`                                          | 관심 인플루언서 목록                             |
| `ChatWidget.tsx`, `ChatHistory.tsx`                       | 챗봇과 상담 이력                                 |
| `SystemConsole.tsx`                                         | 관리자 기능 및 크롤링 화면                       |
| `Campaigns.tsx`, `Links.tsx`                              | 캠페인·외부 링크 화면                           |
| `components/ui/`                                            | 버튼, 입력창, 모달, 표, 차트 등 공통 UI 컴포넌트 |

## 5. 주요 데이터 흐름

### 추천 흐름

```text
사용자 조건 입력
  → 프론트엔드 RecommendPage
  → recommendation API
  → recommendation router
  → 추천 서비스 및 DB 조회
  → 추천 결과·추천 이유 반환
  → 프론트엔드 카드/상세 화면 표시
```

### 인플루언서 크롤링 흐름

```text
관리자 키워드 입력
  → admin API
  → crawler service
  → Apify에서 데이터 수집
  → 팔로워·게시물·참여율 필터링
  → 분류/키워드 처리
  → DB 저장
  → 프로필 이미지 저장
```

현재 이미지 저장 단계는 S3 업로드를 전제로 작성되어 있다.

### 인증 흐름

```text
로그인 요청
  → auth API
  → 사용자 조회 및 비밀번호 검증
  → JWT 발급
  → 프론트엔드 AuthContext 저장
  → 인증이 필요한 API 요청에 토큰 사용
```

## 6. 실행 및 배포 구성

### Docker Compose 서비스

`docker-compose.yml`은 다음 서비스를 정의한다.

- `backend`: FastAPI 서버, 포트 8000
- `frontend`: React 빌드 결과를 제공하는 Nginx, 포트 80/443
- `chatwoot`: 상담 서비스, 포트 3000
- `sidekiq`: Chatwoot 백그라운드 작업
- `redis`: Chatwoot 작업 큐 및 캐시
- `certbot`: HTTPS 인증서 갱신

백엔드와 Chatwoot는 루트 `.env`를 사용하며, DB·JWT·Chatwoot·외부 API 설정이 필요하다.

### 프론트엔드 빌드 설정

- `frontend/vite.config.ts`: Vite 개발 서버와 허용 호스트 설정
- `frontend/package.json`: 개발·빌드 명령과 JavaScript 의존성
- `frontend/nginx.conf`: 배포 시 정적 파일 제공 및 백엔드/Chatwoot 프록시
- `frontend/Dockerfile`: Node 빌드 후 Nginx로 서비스

## 7. 서비스 실행 방법

### 7.1 실행 전 준비

다음 프로그램이 필요하다.

- Docker Desktop 및 Docker Compose
- 또는 개별 실행 시 Python 3.9 이상, Node.js 18 이상
- PostgreSQL 데이터베이스
- 백엔드에 필요한 환경변수 파일 `.env`

현재 저장소에는 실제 `.env`가 포함되어 있지 않다. 루트에 `.env`를 만들고 최소한 다음 항목을 환경에 맞게 설정해야 한다.

```env
PICKPLE_DATABASE_URL=postgresql+psycopg2://사용자:비밀번호@호스트:5432/데이터베이스
SECRET_KEY=충분히_긴_JWT_비밀키
API_TOKEN=Apify_API_토큰
OPENAI_API_KEY=OpenAI_API_키
AWS_ACCESS_KEY=기존_S3_액세스키
AWS_SECRET_KEY=기존_S3_시크릿키
AWS_REGION=ap-northeast-2
BUCKET_NAME=S3_버킷명
VITE_API_BASE_URL=http://localhost:8000
VITE_CHAT_SERVER_URL=http://localhost:3000
```

AWS를 이미 종료한 경우에는 현재 코드가 AWS 변수를 필수로 검증하므로, 실행 전에 S3 의존성을 제거하거나 임시 개발용 설정을 별도로 준비해야 한다. Chatwoot를 사용하지 않는 경우에도 백엔드 설정 모델과 프론트엔드 기능이 요구하는 값을 확인해야 한다.

### 7.2 Docker Compose로 전체 실행

프로젝트 루트에서 실행한다.

```bash
docker compose build
docker compose up -d
```

실행 상태와 로그는 다음 명령으로 확인한다.

```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
```

기본 접속 주소는 다음과 같다.

- 프론트엔드: `http://localhost` 또는 `https://localhost`
- 백엔드 확인: `http://localhost:8000/`
- Chatwoot: `http://localhost:3000`

서비스를 종료하거나 다시 빌드하려면 다음 명령을 사용한다.

```bash
docker compose down
docker compose up -d --build
```

### 7.3 백엔드만 개별 실행

Windows PowerShell 예시는 다음과 같다.

```powershell
cd app
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

프로젝트 루트에서 실행하려면 다음처럼 사용할 수 있다.

```powershell
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

백엔드가 정상적으로 시작되면 `http://localhost:8000/`에서 `{"message":"ok"}` 응답을 확인할 수 있다. Swagger API 문서는 `http://localhost:8000/docs`에서 확인한다.

### 7.4 프론트엔드만 개별 실행

```powershell
cd frontend
npm install
npm run dev
```

프론트엔드 개발 서버는 보통 `http://localhost:5173`에서 실행된다. 이때 `VITE_API_BASE_URL`이 백엔드 주소를 가리키도록 `frontend/.env.local`에 설정할 수 있다.

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_CHAT_SERVER_URL=http://localhost:3000
```

### 7.5 실행이 안 될 때 확인 순서

1. `.env`가 프로젝트 루트 또는 `app/.env`에 있는지 확인한다.
2. `PICKPLE_DATABASE_URL`로 PostgreSQL에 접속 가능한지 확인한다.
3. 백엔드 로그에서 Pydantic 설정 오류 또는 DB 연결 오류를 확인한다.
4. 프론트엔드의 `VITE_API_BASE_URL`이 실제 백엔드 주소와 일치하는지 확인한다.
5. 관리자 크롤링을 실행했다면 Apify 토큰, S3 설정, 이미지 저장 로직이 현재 환경에 맞는지 확인한다.

## 8. 현재 구조에서 주의할 점

1. `app/utils/setting_config.py`의 AWS 설정이 필수값으로 남아 있다. `.env`가 없으면 백엔드 초기화가 실패할 수 있다.
2. `app/services/crawler.py`와 `app/seed/seed_images.py`는 boto3와 S3 버킷을 사용한다. AWS를 종료했다면 크롤링 후 이미지 저장 방식을 변경해야 한다.
3. `docker-compose.yml`은 PostgreSQL 컨테이너를 포함하지 않고 외부 DB URL을 사용한다.
4. `global-bundle.pem`은 PostgreSQL/RDS 연결용 인증서로 보이며, 로컬 DB로 전환할 경우 필요성을 재검토해야 한다.
5. 프론트엔드는 `VITE_API_BASE_URL`이 올바르게 주입되지 않으면 API URL이 정상적으로 생성되지 않는다.
6. `frontend/vite.config.ts`에는 과거 ngrok 호스트 설정이 남아 있으므로 현재 배포 주소에 맞게 정리할 필요가 있다.

## 9. 권장 유지보수 방향

- 기능별로 `router → service → crud → model` 계층을 유지한다.
- API 요청·응답 변경 시 `schemas`와 `frontend/src/api`, 관련 화면 타입을 함께 수정한다.
- AWS 제거 시 S3 관련 설정, `boto3`, 이미지 업로드 함수, S3 URL 생성 코드를 한 번에 정리한다.
- 환경변수 예시 파일을 별도로 제공하되 실제 비밀값은 Git에 커밋하지 않는다.
- 대량 정적 데이터와 프로필 이미지는 별도 저장소 또는 초기 데이터 패키지로 분리하는 것을 검토한다.
