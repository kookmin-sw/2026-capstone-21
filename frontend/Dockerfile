# 1단계: 빌드 (Node.js 환경)
FROM node:18 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# 빌드 시점에 환경변수 받기
ARG VITE_API_BASE_URL
ARG VITE_CHAT_SERVER_URL

# 받은 값을 실제 환경변수로 설정
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_CHAT_SERVER_URL=$VITE_CHAT_SERVER_URL

RUN npm run build

# 2단계: 실행 (Nginx 환경)
FROM nginx:stable-alpine
# 빌드된 결과물(dist 또는 build 폴더)을 Nginx로 복사
COPY --from=build /app/dist /usr/share/nginx/html
# Nginx 기본 포트
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]