@echo off
title GlowGoodly Backend Server (Port 5000)
echo ========================================================
echo    Launching GlowGoodly Backend on http://localhost:5000
echo ========================================================
echo.
cd /d %~dp0backend
echo Checking Prisma database status...
call npx prisma generate
echo Starting backend server with tsx watch...
call npm run dev
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Backend encountered an error. Press any key to exit...
    pause >nul
)

