#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-}"

if [ -z "$ENV_FILE" ]; then
  if [ -f ".env" ]; then ENV_FILE=".env"; elif [ -f "docker/.env" ]; then ENV_FILE="docker/.env"; else ENV_FILE=".env"; fi
fi

docker compose --env-file "$ENV_FILE" down
docker volume ls | grep pm- || true


