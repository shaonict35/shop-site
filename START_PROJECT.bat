@echo off
title GlowGoodly Full Stack Runner
echo ========================================================
echo    Launching GlowGoodly (Backend + Frontend)
echo ========================================================
echo.

echo 1. Launching Backend on http://localhost:5000 ...
start "GlowGoodly Backend (Port 5000)" cmd /k "cd /d %~dp0backend && npm run dev"

echo 2. Launching Frontend on http://localhost:3000 ...
start "GlowGoodly Frontend (Port 3000)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both servers are starting up in separate terminal windows!
echo Waiting for servers to initialize...
timeout /t 6 >nul

echo Opening browser at http://localhost:3000 ...
start http://localhost:3000

echo.
echo Done! Keep the opened terminal windows running while working.
pause
