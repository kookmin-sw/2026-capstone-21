#!/bin/bash
# 초기 Let's Encrypt 인증서 발급 스크립트
# 최초 1회만 실행

set -e

DOMAIN="linkd-match.kr"
EMAIL="20222092@kookmin.ac.kr"
COMPOSE="docker compose"
IMAGE="2026-capstone-21-frontend"

mkdir -p ./certbot/conf
mkdir -p ./certbot/www

# 1. 빌드된 프론트 이미지를 HTTP 전용 설정으로 임시 실행
echo ">>> HTTP 전용 nginx로 시작 (인증서 발급용)..."
docker run -d --name picple-web-init \
  -p 80:80 \
  -v $(pwd)/frontend/nginx-init.conf:/etc/nginx/conf.d/default.conf \
  -v $(pwd)/certbot/www:/var/www/certbot \
  $IMAGE

sleep 2

# 2. certbot으로 인증서 발급
echo ">>> 인증서 발급 중..."
docker run --rm \
  -v $(pwd)/certbot/conf:/etc/letsencrypt \
  -v $(pwd)/certbot/www:/var/www/certbot \
  certbot/certbot certonly \
  --webroot --webroot-path=/var/www/certbot \
  -d $DOMAIN \
  --email $EMAIL \
  --agree-tos --no-eff-email

# 3. 임시 컨테이너 제거
echo ">>> 임시 nginx 제거..."
docker stop picple-web-init && docker rm picple-web-init

# 4. SSL 설정된 정식 frontend 시작
echo ">>> SSL 적용된 frontend 시작..."
$COMPOSE up -d frontend certbot

echo ">>> 완료! https://$DOMAIN 확인하세요."
