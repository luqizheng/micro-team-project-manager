#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-}"

if [ -z "$ENV_FILE" ]; then
  if [ -f ".env" ]; then ENV_FILE=".env"; elif [ -f "docker/.env" ]; then ENV_FILE="docker/.env"; else ENV_FILE=".env"; fi
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "[start] ENV file not found: $ENV_FILE" >&2
  echo "[start] You can copy .env.example to $ENV_FILE and adjust values." >&2
fi

docker compose --env-file "$ENV_FILE" up -d
docker compose ps


