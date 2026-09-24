@echo off
setlocal
cd /d "%~dp0"

echo.
echo [1/2] Running Python tests...
python -m pytest -v
if errorlevel 1 exit /b 1

echo.
echo [2/2] Running release verification...
python verify_release.py
if errorlevel 1 exit /b 1

echo.
echo All BumpMarks checks passed.
endlocal
