$ErrorActionPreference = "Stop"
$root = (Resolve-Path "$PSScriptRoot\..").Path

Write-Host ">>> Installing AI dependencies (Python)..." -ForegroundColor Cyan
Push-Location "$root\ai"
python -m pip install -r requirements.txt
Pop-Location

Write-Host ">>> Installing Backend dependencies (Node.js)..." -ForegroundColor Cyan
Push-Location "$root\backend"
npm install
Pop-Location

Write-Host ">>> Installing Frontend dependencies (Node.js)..." -ForegroundColor Cyan
Push-Location "$root\frontend"
npm install
Pop-Location

Write-Host ">>> All dependencies installed. Starting services..." -ForegroundColor Green
& "$PSScriptRoot\start-local.ps1"
