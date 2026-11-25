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
git commit -m "Phase 2: Critical security and data integrity fixes (admin backdoor removed, live chat privacy rooms, CAPTCHA hardening, atomic orders, negative stock guard, bKash idempotency, JWT revocation)"

echo [3/3] Pushing to GitHub (git push origin main)...
git push origin main

echo.
echo ========================================================
echo Done! All changes successfully pushed to GitHub.
echo ========================================================
pause
