@echo off
setlocal enabledelayedexpansion

REM ==============================================================================
REM Hey Friday Single-Instance Supervisor Launcher (Batch Wrapper) (<35 lines)
REM ==============================================================================

title Hey Friday Desktop Supervisor

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%..\.."
set "PROJECT_ROOT=%CD%"

powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%start_friday.ps1"
set "EXIT_CODE=%ERRORLEVEL%"

if %EXIT_CODE% neq 0 (
    echo.
    echo [CRASH DETECTED] Hey Friday exited with code %EXIT_CODE%
    pause
)

exit /b %EXIT_CODE%
