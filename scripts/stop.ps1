param(
  [string]$EnvFile
)

if (-not $EnvFile) {
  if (Test-Path ".env") { $EnvFile = ".env" }
  elseif (Test-Path "docker/.env") { $EnvFile = "docker/.env" }
  else { $EnvFile = ".env" }
}

docker compose --env-file $EnvFile down
docker volume ls | Select-String "pm-" | Out-Null


