@echo off
title Push to Git - GlowGoodly
echo ========================================================
echo   Pushing all changes to GitHub (shaonict35/shaonict35)
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Staging changes (git add .)...
git config user.name "shaonict35"
git config user.email "shaonict35@gmail.com"
git add .

echo [2/3] Committing changes...
git commit --author="shaonict35 <shaonict35@gmail.com>" -m "Fix shop page bounce, sync homepage deals and brand offers with cPanel DB and admin panel"

echo [3/3] Pushing to GitHub (git push origin main)...
git push -u origin main

echo.
echo ========================================================
echo Done! Please check above output to verify push status.
echo ========================================================
pause
