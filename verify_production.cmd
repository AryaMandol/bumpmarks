@echo off
setlocal
cd /d "%~dp0"

if "%~1"=="" (
    echo Usage: verify_production.cmd https://your-bumpmarks-domain
    exit /b 1
)

set "EXPECTED_REVISION="
for /f "delims=" %%C in ('git rev-parse HEAD 2^>nul') do set "EXPECTED_REVISION=%%C"

if not defined EXPECTED_REVISION (
    echo ERROR: Could not determine the current Git commit.
    exit /b 1
)

echo.
echo Local revision: %EXPECTED_REVISION%
echo Checking live Render deployment...
echo.

python verify_production.py "%~1" --expected-revision "%EXPECTED_REVISION%"
endlocal
