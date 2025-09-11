#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env}"

docker compose --env-file "$ENV_FILE" down
docker volume ls | grep pm- || true


