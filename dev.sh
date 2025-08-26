#!/usr/bin/env bash
set -euo pipefail
export KEYCLOAK_ENABLED=false
cd "$(dirname "$0")"
docker compose up -d
( cd backend-nest && npm run start:dev ) &
( cd frontend && npm run dev ) &
wait
