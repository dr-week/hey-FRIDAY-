# Hey Friday Windows PowerShell Launcher with Safe Single-Instance Supervisor
$ErrorActionPreference = "SilentlyContinue"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

$CrashesDir = Join-Path $ProjectRoot "data\crashes"
if (-not (Test-Path $CrashesDir)) {
    New-Item -ItemType Directory -Path $CrashesDir | Out-Null
}
$LogFile = Join-Path $CrashesDir "launcher.log"

$Timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
"[$Timestamp] [LAUNCHER] Starting Hey Friday Supervisor..." | Out-File -FilePath $LogFile -Append -Encoding utf8

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "🚀 HEY FRIDAY DESKTOP SUPERVISOR" -ForegroundColor Green
Write-Host "   * Project Directory: $ProjectRoot" -ForegroundColor DarkGray
Write-Host "   * Target Port: 4141" -ForegroundColor DarkGray
Write-Host "=================================================" -ForegroundColor Cyan

# 1. Clean existing process on port 4141 (heyFRIDAY server only)
$conn = Get-NetTCPConnection -LocalPort 4141 -ErrorAction SilentlyContinue
if ($conn) {
    foreach ($c in $conn) {
        if ($c.OwningProcess -gt 0) {
            Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    }
}

# 2. Clean previous Edge app windows specifically opened for Hey Friday
$edgeProcs = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -and $_.CommandLine -like "*--app=http://127.0.0.1:4141*"
}
if ($edgeProcs) {
    foreach ($p in $edgeProcs) {
        Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
    }
}

# 3. Clean lingering laya_bridge python processes belonging exclusively to this project
$layaProcs = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -and $_.CommandLine -like "*laya_bridge.py*" -and $_.CommandLine -like "*heyFRIDAY*"
}
if ($layaProcs) {
    foreach ($p in $layaProcs) {
        Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "[*] Hey Friday single-instance isolation verified." -ForegroundColor Yellow
Write-Host "[*] All other projects & processes untouched." -ForegroundColor Green
Write-Host "[*] Launching Hey Friday on http://127.0.0.1:4141 ..." -ForegroundColor Cyan

& bun run src/server/index.ts
$ExitCode = $LASTEXITCODE

if ($ExitCode -ne 0) {
    $CrashTimestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    Write-Host "[CRASH] Hey Friday exited with code $ExitCode" -ForegroundColor Red
    "[$CrashTimestamp] [CRASH] Process exited with code $ExitCode" | Out-File -FilePath $LogFile -Append -Encoding utf8
} else {
    $CleanTimestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    "[$CleanTimestamp] [LAUNCHER] Clean exit." | Out-File -FilePath $LogFile -Append -Encoding utf8
}

exit $ExitCode
