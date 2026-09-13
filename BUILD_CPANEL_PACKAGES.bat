@echo off
title GlowGoodly cPanel Packaging
echo ========================================================
echo    Packaging GlowGoodly for cPanel Deployment
echo ========================================================
echo.
cd /d "%~dp0"
node scripts/build-cpanel-packages.js
echo.
echo ========================================================
echo Output files saved in \deploy\ directory:
echo   1. glowgoodly-backend-cpanel.zip
echo   2. glowgoodly-frontend-cpanel.zip
echo ========================================================
pause
