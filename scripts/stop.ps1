param(
  [string]$EnvFile = ".env"
)

docker compose --env-file $EnvFile down
docker volume ls | Select-String "pm-" | Out-Null


