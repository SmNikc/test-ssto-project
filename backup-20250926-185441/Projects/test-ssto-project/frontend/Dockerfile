# ---------- build ----------
FROM node:18-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Важно: базовый URL берём из build-arg; по умолчанию /api (через Nginx)
ARG VITE_API_BASE_URL=/api
ARG VITE_APP_NAME="Тест ССТО"
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_APP_NAME=$VITE_APP_NAME

COPY . .
RUN npm run build

# ---------- runtime ----------
FROM nginx:1.25-alpine
WORKDIR /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist ./
EXPOSE 80
