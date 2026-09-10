@echo off
title Seed Default Promo Banners
echo ========================================================
echo    Seeding default promo banners into database...
echo ========================================================
echo.
cd /d %~dp0backend
node src/seed-banners.js
echo.
echo ========================================================
pause
