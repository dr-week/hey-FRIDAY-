@echo off
setlocal enabledelayedexpansion

REM ==============================================================================
REM Hey Friday Single-Instance Supervisor Launcher (Isolated Execution)
REM Policy: Kill previous Hey Friday instances to avoid port collisions and 
REM close dangling Hey Friday app windows without touching any other projects.
REM ==============================================================================

title Hey Friday Desktop Supervisor

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%.."
set "PROJECT_ROOT=%CD%"

powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%start_friday.ps1"
set "EXIT_CODE=%ERRORLEVEL%"

if %EXIT_CODE% neq 0 (
    echo.
    echo [CRASH DETECTED] Process exited with code %EXIT_CODE%
    pause
)

exit /b %EXIT_CODE%
