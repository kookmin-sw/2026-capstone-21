# 1단계: 빌드
FROM node:18 AS build
WORKDIR /app

# 현재 컨텍스트(frontend 폴더)의 파일을 /app으로 복사
COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN ls -al

# 빌드 시점에 환경변수 주입
ARG VITE_API_BASE_URL
ARG VITE_CHAT_SERVER_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_CHAT_SERVER_URL=$VITE_CHAT_SERVER_URL

RUN npm run build

# 2단계: 실행 (Nginx 환경)
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]