# Delegator to scripts/supervisor/start_friday.ps1
$ScriptPath = Join-Path $PSScriptRoot "supervisor\start_friday.ps1"
& powershell -NoProfile -ExecutionPolicy Bypass -File $ScriptPath
