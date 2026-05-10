#!/bin/bash
set -e

echo "📂 [2/7] 카테고리 데이터 시딩..."
python -m app.seed.seed_categories

echo "📸 [3/7] 인플루언서 데이터 시딩..."
python -m app.seed.seed_influencers

echo "🤷‍♀️ [4/7] 초기 유저 데이터 시딩..."
python -m app.seed.seed_users

echo "🤷 [5/7] 초기 인플루언서 이미지 데이터 시딩..."
python -m app.seed.seed_images

echo "📝 [6/7] 초기 액션 로그 데이터 시딩..."
python -m app.seed.seed_logs

echo "🧠 [7/7] FAISS 벡터 임베딩 구축..."
python -m app.services.build_influencer_embeddings
