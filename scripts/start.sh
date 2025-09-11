#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env}"

if [ ! -f "$ENV_FILE" ]; then
  echo "[start] ENV file not found: $ENV_FILE" >&2
  echo "[start] You can copy .env.example to $ENV_FILE and adjust values." >&2
fi

docker compose --env-file "$ENV_FILE" up -d
docker compose ps


