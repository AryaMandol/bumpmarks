@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"

for /f "delims=" %%R in ('git config --get remote.origin.url') do set "REPO=%%R"

if not defined REPO (
    echo ERROR: No origin Git remote was found.
    exit /b 1
)

set "REPO=!REPO:git@github.com:=https://github.com/!"
set "REPO=!REPO:.git=!"

if /i not "!REPO:~0,19!"=="https://github.com/" (
    echo ERROR: origin is not a GitHub repository URL:
    echo !REPO!
    exit /b 1
)

set "DEPLOY_URL=https://render.com/deploy?repo=!REPO!"

echo Opening Render Blueprint deployment for:
echo !REPO!
start "" "!DEPLOY_URL!"

endlocal
