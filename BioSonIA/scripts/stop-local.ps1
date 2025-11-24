$ErrorActionPreference = "Stop"
function StopByPort($port){
  try {
    $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction Stop
    $pids = $conns | Select-Object -ExpandProperty OwningProcess | Sort-Object -Unique
    foreach($pid in $pids){
      try { Stop-Process -Id $pid -Force -ErrorAction Stop; Write-Host "Stopped PID $pid on port $port" } catch {}
    }
  } catch {}
}
StopByPort 3000
StopByPort 5000
StopByPort 5001
Write-Host "Servicios locales detenidos (3000/5000/5001)" -ForegroundColor Yellow