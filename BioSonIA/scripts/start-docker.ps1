$ErrorActionPreference = "Stop"
$root = (Resolve-Path "$PSScriptRoot\..").Path
$envFile = Join-Path $root ".env"
if(!(Test-Path $envFile)){ Write-Host "Crea .env desde .env.example en $root" -ForegroundColor Yellow }
Push-Location (Join-Path $root "docker")
docker-compose --env-file ../.env up --build -d
Pop-Location
Write-Host "Servicios Docker iniciados:" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "Backend:  http://localhost:5000" -ForegroundColor Green
Write-Host "AI:       http://localhost:5001" -ForegroundColor Green