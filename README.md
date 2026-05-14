# LinkD-Match

AI 기반 인플루언서 매칭 솔루션 — 쇼핑몰 상품 정보와 인플루언서 데이터를 분석하여 최적의 인플루언서를 추천합니다.

## 📁 프로젝트 구조

```
2026-capstone-21/
├── app/                    # 백엔드 (FastAPI, Python 3.9)
│   ├── routers/            # API 엔드포인트 (auth, chat, recommendation, influencer 등)
│   ├── services/           # 비즈니스 로직 (chatbot, recommendation, mall_analyzer 등)
│   ├── db/                 # DB 모델 및 연결 (PostgreSQL + pgvector)
│   ├── schemas/            # Pydantic 요청/응답 스키마
│   ├── crud/               # CRUD 함수
│   ├── seed/               # 초기 데이터 시딩
│   ├── utils/              # 유틸리티 (인증, 설정)
│   └── data/               # 데이터 파일 (JSON, 프로필 이미지)
├── frontend/               # 프론트엔드 (React + Vite + TailwindCSS)
│   ├── src/app/components/ # 페이지 컴포넌트
│   ├── src/api/            # API 클라이언트
│   ├── src/app/context/    # React Context (Auth, Influencer)
│   └── public/             # 정적 파일 (로고, 파비콘)
├── chatwoot/               # Chatwoot 소스 (git submodule, 관리자 대시보드)
├── model_cache/            # BGE-M3 임베딩 모델 캐시
├── docs/                   # 문서 및 이미지
├── docker-compose.yml      # 전체 서비스 오케스트레이션
├── .env                    # 환경변수 (DB, API 키 등)
├── CHANGELOG.md            # 패치노트
└── trouble.md              # 트러블슈팅 및 수정사항 기록
```

## 🚀 실행 방법

```bash
# 전체 서비스 실행
docker compose up -d

# 개별 빌드
docker compose build frontend backend
docker compose up -d frontend backend
```

| 서비스 | 포트 | 설명 |
|--------|------|------|
| frontend | :80 | React 웹 앱 (Nginx) |
| backend | :8000 | FastAPI 서버 |
| chatwoot | :3000 | 챗봇 관리자 대시보드 |
| redis | 내부 | Chatwoot 캐시 |

---

## 💡 프로젝트 배경

![Project Background](./docs/images/project_background.png)
### ⏳ 어필리에이트 마케팅의 인플루언서 탐색에 많은 시간 소요
- 🔍 상품과 어울리는 인플루언서를 직접 검색해야 함
- 📊 콘텐츠 분위기, 카테고리, 팔로워 수 등을 하나씩 비교해야 함
- 🤔 브랜드 이미지와 맞는 계정을 판단하기 어려움
- 💸 소규모 쇼핑몰은 인력·예산 부족으로 탐색 부담 증가

<br>

## 🚀 프로젝트 소개

![Project Core](./docs/images/project_core.png)
### AI 기반 인플루언서 매칭 솔루션

> **“수작업 탐색에서 AI 기반 추천 매칭으로”**  
> **“상품과 어울리는 인플루언서를 AI로 더 빠르고 정확하게”**

Link:D Match는 쇼핑몰 상품 정보와 인플루언서 데이터를 분석하여, 상품과 가장 어울리는 인플루언서를 추천하는 AI 기반 인플루언서 매칭 솔루션

### ⏱️ 탐색 시간 및 비용 절감

- 인플루언서 탐색 과정 자동화를 통해 수작업 비교 부담을 줄이고, 탐색에 소요되는 시간과 비용을 절감할 수 있음

### 🛍️ 소규모 쇼핑몰의 마케팅 실행 지원

- 전문 마케팅 인력이 없는 소규모 쇼핑몰도 추천 결과를 활용하여 보다 쉽게 인플루언서 마케팅을 시작할 수 있음

### 🎯 상품 적합도 기반 인플루언서 추천

- 단순 수치 지표(팔로워 수, 좋아요 수) 중심이 아닌, 상품 적합도를 기반으로 브랜드와 어울리는 인플루언서를 추천함

<br>

## 📌 주요 기능

### 🔍 인플루언서 검색 기능

<p align="center">
  <img src="./docs/images/project_influencerList1.png" width="48%" alt="Influencer List 1">
  &nbsp;
  <img src="./docs/images/project_influencerList2.png" width="48%" alt="Influencer List 2">
</p>

**조건 및 키워드 기반 인플루언서 탐색 기능**

- 카테고리, 팔로워 수 기반 검색 지원
- “청소용품”, “주방용품”과 같은 키워드를 입력하면, 해당 키워드가 미리 저장된 인플루언서를 검색 결과에 제공

<br>

### 🤖 인플루언서 추천 기능
<여기에 사진 넣기!>

**자연어 기반 AI 추천 기능**

#### ① 상품 정보 입력

- 사용자는 원하는 분위기의 상품 정보를 입력할 수 있음  
  예: “따뜻한 분위기의 인테리어 용품”

#### ② 추천 요소 분석 수행

- 시스템은 상품 유사도, 인플루언서 등급, 사용자 행동 로그를 종합 반영하여 추천을 수행함

#### ③ 추천 결과 제공

- 시스템은 분석 결과를 기반으로 적합도가 높은 순서대로 인플루언서 추천 결과를 카드 형식으로 제공함

<br>

### ⭐ 관심목록 기능
<p align="center">
  <img src="./docs/images/project_favorite1.png" width="48%" alt="Favorite 1">
  &nbsp;
  <img src="./docs/images/project_favorite2.png" width="48%" alt="Favorite 2">
  &nbsp;
</p>

**관심 인플루언서 저장 및 메모 기능**

- 관심목록 저장 및 메모 기능을 통한 협업 후보 관리 지원

<br>

### 📊 통계 차트 기능
<p align="center">
  <img src="./docs/images/project_dataInsight1.png" width="48%" alt="Data Insight 1">
  &nbsp;
  <img src="./docs/images/project_dataInsight2.png" width="48%" alt="Data Insight 2">
  &nbsp;
</p>

**인플루언서 통계 및 비교 기능**

- 날짜별 추천 및 선택 추이 제공
- 카테고리별 인플루언서 분포 시각화 지원
- 팔로워 수, 반응도, 활동성을 기반으로 산정한 Grade Score 리더보드 제공
- 인플루언서 비교 기능 지원

<br>

### 💬 챗봇 기능
<p align="center">
  <img src="./docs/images/project_chatBot1.png" width="48%" alt="ChatBot 1">
  &nbsp;
  <img src="./docs/images/project_chatBot2.png" width="48%" alt="ChatBot 2">
</p>

**추천 안내 및 FAQ 지원 기능**

- 사용자가 입력한 상품 조건에 맞는 추천 결과 안내
- 인플루언서 선택 방법 및 추천 기준 설명
- 서비스 이용 중 자주 발생하는 질문에 대한 FAQ 제공

<br>

## ✨ 기대 효과

### 🛍️ 자사몰 마케팅 고도화
AI 기반 인플루언서 추천 기술로 국내 자사몰과 중소형 이커머스의 마케팅 접근성과 운영 효율 향상에 기여

### 🤖 AI 기술 경쟁력 강화
데이터 기반 추천/분석 시스템을 서비스에 적용하여 국내 AI 기반 마케팅 기술 경쟁력 강화 및 서비스 고도화에 활용

### 🌏 글로벌 시장 확장
국내 인플루언서를 해외 서비스와 연계하여 글로벌 브랜드 협업과 해외 시장 진출 가능성을 확대하고, 국내 콘텐츠 기반 수익 창출에 기여

<br>

## 🙋‍♂️ 팀원 소개

| 사진 | 이름 | 역할 | GitHub | Email |
|---|---|---|---|---|
|<img src="./docs/images/joohee_profile.webp" width="120" height="120" style="object-fit: cover;"> | 고주희 (팀장) | AI & Data Processing | <a href="https://github.com/jooheeko"><img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/github.svg" width="20" alt="GitHub"> @jooheeko</a> | 20222092@kookmin.ac.kr  |
| <img src="./docs/images/eunjin_profile.jpg" width="120" height="120" style="object-fit: cover;"> | 이은진 | Back-end | <a href="https://github.com/molba2see"><img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/github.svg" width="20" alt="GitHub"> @molba2see</a> | 20232861@kookmin.ac.kr |
| <img src="./docs/images/yunji_profile.jpg" width="120" height="120" style="object-fit: cover;"> | 최윤지  | Back-end | <a href="https://github.com/yunji0417"><img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/github.svg" width="20" alt="GitHub"> @yunji0417</a> | yunji0417@kookmin.ac.kr |
| <img src="./docs/images/songhoon_profile.jpg" width="120" height="120" style="object-fit: cover;"> | 백송훈 | Front-end | <a href="https://github.com/100songhoon"><img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/github.svg" width="20" alt="GitHub"> @100songhoon</a> | songhoon@kookmin.ac.kr |
| <img src="./docs/images/hyungseok_profile.jpg" width="120" height="120" style="object-fit: cover;"> | 오형석 | Front-end | <a href="https://github.com/lovesuperlit"><img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/github.svg" width="20" alt="GitHub"> @lovesuperlit</a> | ohsoksk1569@kookmin.ac.kr |

<br>

## 🛠️ 기술 스택

### 🔍 AI & Data Processing
![Apify](https://img.shields.io/badge/Apify-FF5A00?style=for-the-badge&logo=apify&logoColor=white) ![BeautifulSoup](https://img.shields.io/badge/BeautifulSoup-4B8BBE?style=for-the-badge&logo=python&logoColor=white) ![Pandas](https://img.shields.io/badge/Pandas-150458?style=for-the-badge&logo=pandas&logoColor=white) ![GPT-4o mini](https://img.shields.io/badge/GPT--4o%20mini-412991?style=for-the-badge&logo=openai&logoColor=white) ![BGE-M3](https://img.shields.io/badge/BGE--M3-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black) ![LightFM](https://img.shields.io/badge/LightFM-00A98F?style=for-the-badge&logo=python&logoColor=white) ![Thompson Sampling](https://img.shields.io/badge/Thompson%20Sampling-7C3AED?style=for-the-badge&logo=python&logoColor=white)

### 💾 Back-end
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white) ![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-D71F00?style=for-the-badge&logo=sqlalchemy&logoColor=white) ![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white) ![Chatwoot API](https://img.shields.io/badge/Chatwoot%20API-1F93FF?style=for-the-badge&logo=chatwoot&logoColor=white)

### 🖥️ Front-end
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) ![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=FFD62E) ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-0F172A?style=for-the-badge&logo=tailwindcss&logoColor=38BDF8) ![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?style=for-the-badge&logo=shadcnui&logoColor=white) ![Recharts](https://img.shields.io/badge/Recharts-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)

### 🗄️ DB / Storage
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white) ![pgvector](https://img.shields.io/badge/pgvector-336791?style=for-the-badge&logo=postgresql&logoColor=white) ![AWS RDS](https://img.shields.io/badge/AWS%20RDS-527FFF?style=for-the-badge&logo=amazonrds&logoColor=white) ![AWS S3](https://img.shields.io/badge/AWS%20S3-569A31?style=for-the-badge&logo=amazons3&logoColor=white)

### ☁️ Infra / DevOps
![Docker Compose](https://img.shields.io/badge/Docker%20Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white) ![Nginx](https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white) ![AWS EC2](https://img.shields.io/badge/AWS%20EC2-FF9900?style=for-the-badge&logo=amazonec2&logoColor=white)

### 📚 Tools
![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white) ![Notion](https://img.shields.io/badge/Notion-000000?style=for-the-badge&logo=notion&logoColor=white) ![ClickUp](https://img.shields.io/badge/ClickUp-7B68EE?style=for-the-badge&logo=clickup&logoColor=white) ![Discord](https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white) ![Figma](https://img.shields.io/badge/Figma-F24E1E?style=for-the-badge&logo=figma&logoColor=white)

<br>

### ⚙️ 사용법

소스코드제출시 설치법이나 사용법을 작성하세요.

<br>

## 📝 자료

발표 자료 또는 수행계획서

