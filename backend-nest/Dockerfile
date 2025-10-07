# Stage 1: Builder
FROM node:20-alpine AS builder

# System deps for native builds (bcrypt, etc.)
RUN apk add --no-cache python3 make g++ gcc

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build NestJS
RUN npm run build

# Reduce node_modules to production set (keeps compiled bcrypt)
RUN npm prune --omit=dev

# Stage 2: Runner
FROM node:20-alpine AS runner
WORKDIR /app

# Copy built artifacts and production deps
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
EXPOSE 3001

# Healthcheck (optional endpoint /health)
HEALTHCHECK --interval=10s --timeout=3s --start-period=30s \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start
CMD ["node", "dist/main.js"]
