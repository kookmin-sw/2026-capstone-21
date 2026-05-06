# 1단계: 빌드 (Node.js 환경)
FROM node:18 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 2단계: 실행 (Nginx 환경)
FROM nginx:stable-alpine
# 빌드된 결과물(dist 또는 build 폴더)을 Nginx로 복사
COPY --from=build /app/dist /usr/share/nginx/html
# Nginx 기본 포트
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]