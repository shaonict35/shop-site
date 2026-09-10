@echo off
title Clear All Promo Banners
echo ========================================================
echo    Clearing all promo banners from database...
echo ========================================================
echo.
cd /d %~dp0backend
node src/insert-banners.js
echo.
echo ========================================================
pause
