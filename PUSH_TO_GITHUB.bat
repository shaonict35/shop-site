@echo off
title Push GlowGoodly to GitHub
echo ========================================================
echo Pushing latest committed changes to GitHub...
echo ========================================================
cd /d "%~dp0"
git push origin main
echo.
echo ========================================================
echo Done! If asked, sign in with your GitHub account in browser.
echo ========================================================
pause
