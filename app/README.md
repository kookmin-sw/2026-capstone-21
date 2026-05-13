# 📦 Backend (FastAPI)

AI 기반 인플루언서 매칭 솔루션의 백엔드 서버입니다.

## 폴더 구조

```
app/
├── main.py                 # FastAPI 앱 엔트리포인트
├── Dockerfile              # 백엔드 Docker 이미지 빌드
├── requirements.txt        # Python 의존성 목록
├── setup_project.sh        # 프로젝트 초기 설정 스크립트
├── download_model.py       # 임베딩 모델 다운로드 스크립트
├── routers/                # API 라우터
│   ├── auth               # 인증 (로그인/회원가입)
│   ├── chat               # 챗봇 대화
│   ├── chatwoot           # Chatwoot 연동
│   ├── recommendation     # AI 추천
│   ├── influencer         # 인플루언서 검색/조회
│   ├── favorite           # 관심목록
│   ├── insight            # 통계/인사이트
│   ├── mall_input         # 쇼핑몰 상품 입력
│   ├── admin              # 관리자
│   ├── category           # 카테고리
│   └── user_action_log    # 사용자 행동 로그
├── services/               # 비즈니스 로직
│   ├── chatbot            # 챗봇 서비스
│   ├── recommendation     # 추천 엔진
│   ├── mall_analyzer      # 쇼핑몰 분석
│   ├── crawler            # 크롤링
│   ├── classify           # 분류
│   ├── favorite           # 관심목록 처리
│   ├── user_action_log    # 행동 로그 처리
│   └── build_influencer_embeddings  # 인플루언서 임베딩 생성
├── db/                     # 데이터베이스
│   ├── models.py          # SQLAlchemy 모델
│   └── database.py        # DB 연결 설정
├── schemas/                # Pydantic 요청/응답 스키마
├── crud/                   # CRUD 함수
├── seed/                   # 초기 데이터 시딩
├── utils/                  # 유틸리티
│   ├── auth               # 인증 헬퍼 (JWT 등)
│   ├── config             # 환경 설정
│   └── setting_config     # 설정 관리
└── data/                   # 데이터 파일 (JSON, 프로필 이미지)
```
