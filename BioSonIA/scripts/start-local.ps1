param(
  [switch]$Install
)
$ErrorActionPreference = "Stop"
$root = (Resolve-Path "$PSScriptRoot\..").Path
function StartProc($cwd, $cmd){ Start-Process -FilePath "powershell" -WorkingDirectory $cwd -ArgumentList "-NoExit","-Command","$cmd" }
if($Install){
  Push-Location "$root\frontend"; if(!(Test-Path node_modules)){ npm install }; Pop-Location
  Push-Location "$root\backend"; if(!(Test-Path node_modules)){ npm install }; Pop-Location
}
StartProc "$root\ai" "python server.py"
StartProc "$root\backend" "$env:DISABLE_DB='true'; $env:AI_SERVICE_URL='http://localhost:5001'; npm run dev"
StartProc "$root\frontend" "$env:NEXT_PUBLIC_BACKEND_URL='http://localhost:5000'; npm run dev"
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "Backend:  http://localhost:5000" -ForegroundColor Green
Write-Host "AI:       http://localhost:5001" -ForegroundColor Green