param(
  [string]$EnvFile
)

if (-not $EnvFile) {
  if (Test-Path ".env") { $EnvFile = ".env" }
  elseif (Test-Path "docker/.env") { $EnvFile = "docker/.env" }
  else { $EnvFile = ".env" }
}

if (!(Test-Path $EnvFile)) {
  Write-Warning "[start] ENV file not found: $EnvFile"
  Write-Host "[start] You can copy .env.example to $EnvFile and adjust values."
}

docker compose --env-file $EnvFile up -d
docker compose ps


