@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"

set /p VERSION=<VERSION
set "TAG=v!VERSION!"

echo.
echo ============================================
echo BumpMarks !TAG! Release
echo ============================================
echo.

call test.cmd
if errorlevel 1 exit /b 1

if not "%~1"=="" (
    echo.
    echo Verifying production URL before release...
    call verify_production.cmd "%~1"
    if errorlevel 1 exit /b 1
)

git diff --quiet
if errorlevel 1 (
    echo ERROR: Working tree has unstaged changes. Commit them first.
    exit /b 1
)

git diff --cached --quiet
if errorlevel 1 (
    echo ERROR: Working tree has staged but uncommitted changes. Commit them first.
    exit /b 1
)

for /f "delims=" %%S in ('git status --porcelain') do (
    echo ERROR: Working tree is not clean.
    git status --short
    exit /b 1
)

git fetch --tags origin

git rev-parse "!TAG!" >nul 2>nul
if not errorlevel 1 (
    echo ERROR: Tag !TAG! already exists locally.
    exit /b 1
)

git tag -a "!TAG!" -m "BumpMarks !TAG!"
if errorlevel 1 exit /b 1

git push origin "!TAG!"
if errorlevel 1 (
    echo ERROR: Could not push !TAG!.
    git tag -d "!TAG!" >nul 2>nul
    exit /b 1
)

echo.
echo !TAG! pushed successfully.
echo GitHub Actions will build and publish the GitHub Release automatically.
echo.
endlocal
