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
function TestFFmpeg(){ try { return [bool](Get-Command ffmpeg -ErrorAction Stop) } catch { return $false } }
function PickFrontPort(){ $p=3000; try { $ok = (Test-NetConnection -ComputerName 'localhost' -Port 3000 -WarningAction SilentlyContinue).TcpTestSucceeded; if($ok){ $p=3010 } } catch { $p=3000 } return $p }
function PickAIPort(){ $ports=@(5001,5002,5003); foreach($p in $ports){ try { $ok=(Test-NetConnection -ComputerName 'localhost' -Port $p -WarningAction SilentlyContinue).TcpTestSucceeded; if(-not $ok){ return $p } } catch { return $p } }; return 5001 }
function FindFFmpeg(){
  $candidates = @(
    "C:\ffmpeg\bin\ffmpeg.exe",
    "$env:ProgramFiles\FFmpeg\bin\ffmpeg.exe",
    "$env:ProgramFiles\Gyan\FFmpeg\bin\ffmpeg.exe",
    "$env:LOCALAPPDATA\Programs\ffmpeg\bin\ffmpeg.exe"
  )
  foreach($p in $candidates){ if(Test-Path $p){ return $p } }
  try {
    $hit = Get-ChildItem "$env:LOCALAPPDATA" -Recurse -Filter ffmpeg.exe -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName
    if($hit){ return $hit }
  } catch {}
  return $null
}
Push-Location "$root\backend"
$env:DATABASE_URL = "file:./dev.db"
if(!(Test-Path "$root\backend\prisma\dev.db")){
  npx prisma migrate dev --name init
}
npx prisma generate
Pop-Location
if(!(TestFFmpeg)){ Write-Host "FFmpeg no disponible: MP3 puede fallar. Instala con 'winget install -e --id Gyan.FFmpeg' y reinicia." -ForegroundColor Yellow }
$ap = PickAIPort
$ff = FindFFmpeg
if($ff){ Write-Host ("Usando FFmpeg en: {0}" -f $ff) -ForegroundColor Yellow }
StartProc "$root\ai" "$(if($ff){ $env:FFMPEG_BINARY='$ff'; }); $env:PORT='$ap'; python server.py"
StartProc "$root\backend" "$env:DISABLE_DB=''; $env:AI_SERVICE_URL=('http://localhost:' + $ap); $env:PORT='5000'; npm run dev"
$fp = PickFrontPort
StartProc "$root\frontend" "$env:NEXT_PUBLIC_BACKEND_URL='http://localhost:5000'; npm run dev -- -p $fp"
Write-Host ("Frontend: http://localhost:{0}" -f $fp) -ForegroundColor Green
Write-Host "Backend:  http://localhost:5000" -ForegroundColor Green
Write-Host ("IA:       http://localhost:{0}" -f $ap) -ForegroundColor Green
