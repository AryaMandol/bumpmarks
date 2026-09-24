@echo off
setlocal
cd /d "%~dp0"

if "%~1"=="" (
    echo Usage: verify_production.cmd https://your-bumpmarks-domain
    exit /b 1
)

python verify_production.py "%~1"
endlocal
