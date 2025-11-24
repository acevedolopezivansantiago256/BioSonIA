$ErrorActionPreference = "Stop"
Push-Location (Join-Path (Resolve-Path "$PSScriptRoot\..").Path "docker")
docker-compose down
Pop-Location
Write-Host "Servicios Docker detenidos" -ForegroundColor Yellow