@echo off
setlocal
cd /d "%~dp0"
python build_static.py
if errorlevel 1 exit /b 1
python verify_release.py --skip-build
endlocal
