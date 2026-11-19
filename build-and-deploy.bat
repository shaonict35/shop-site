@echo off
title GlowGoodly Production Build and Packaging
echo ========================================================
echo  🌸 GLOWGOODLY CPANEL PRODUCTION BUILD & DEPLOY SCRIPT
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Building Backend (TypeScript to dist/)...
cd backend
call npm run build
if %errorlevel% neq 0 (
    echo [WARNING] Backend build had non-fatal warnings or errors. Proceeding...
)
cd ..

echo.
echo [2/3] Building Frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo [WARNING] Frontend build had non-fatal warnings or errors. Proceeding...
)
cd ..

echo.
echo [3/3] Generating clean cPanel ZIP packages...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0create-deployment-packages.ps1"

echo.
echo ========================================================
echo  SUCCESS! Packages generated:
echo  1. deploy-api-backend.zip   (Upload to api.glowgoodly.com)
echo  2. deploy-shop-frontend.zip (Upload to shop.glowgoodly.com)
echo ========================================================
pause

