set -e

echo "🚀 [1/7] 필수 라이브러리 설치..."
pip install -r requirements.txt

echo "🏗️ [2/7] DB 테이블 생성..."
python -c "from app.db.database import engine; from app.db import models; models.Base.metadata.create_all(bind=engine)"

echo "📂 [3/7] 카테고리 데이터 시딩..."
python -m app.seed.seed_categories

echo "📸 [4/7] 인플루언서 데이터 시딩..."
python -m app.seed.seed_influencers

echo "📝 [5/7] 초기 액션 로그 데이터 시딩..."
python -m app.seed.seed_logs

echo "🤷‍♀️ [6/7] 초기 유저 데이터 시딩..."
python -m app.seed.seed_users

echo "🧠 [7/7] FAISS 벡터 임베딩 구축..."
python -m app.services.build_influencer_embeddings