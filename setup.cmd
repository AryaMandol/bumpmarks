@echo off
setlocal
cd /d "%~dp0"

echo.
echo ============================================
echo BumpMarks - Dependency Setup
echo ============================================
echo.

where python >nul 2>nul
if errorlevel 1 (
    echo ERROR: Python was not found in PATH.
    echo Install Python 3.11 or newer and try again.
    exit /b 1
)

echo Installing dependencies...
python -m pip install -r requirements.txt
if errorlevel 1 exit /b 1

echo.
echo Setup complete.
echo.
echo Next:
echo   test.cmd
echo   python app.py
echo.
endlocal
