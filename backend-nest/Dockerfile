# Stage 1: Builder
FROM node:20-alpine AS builder

# Установка build tools для компиляции нативных модулей (sqlite3, bcrypt)
RUN apk add --no-cache python3 make g++ gcc

WORKDIR /app

# Копируем package files
COPY package*.json ./

# Устанавливаем все зависимости (включая dev)
RUN npm install

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

# Stage 2: Runner
FROM node:20-alpine AS runner

# Установка build tools (нужны для sqlite3 при npm ci)
RUN apk add --no-cache python3 make g++ gcc

WORKDIR /app

# Копируем package files
COPY package*.json ./

# Устанавливаем только production зависимости
RUN npm ci --omit=dev

# Копируем собранное приложение из builder
COPY --from=builder /app/dist ./dist

# Копируем дополнительные файлы (если есть)
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Порт приложения
EXPOSE 3001

# Healthcheck
HEALTHCHECK --interval=10s --timeout=3s --start-period=30s \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Запуск
CMD ["node", "dist/main"]