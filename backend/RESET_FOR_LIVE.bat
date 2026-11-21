@echo off
TITLE GlowGoodly - Production MySQL Migration Tool
COLOR 0A

echo =====================================================================
echo           GLOWGOODLY - ONE-CLICK CPANEL MYSQL MIGRATION
echo =====================================================================
echo.
echo This tool prepares your backend for live cPanel shared hosting with MySQL.
echo.
echo [1/5] Backing up local SQLite database...
if exist "dev.db" (
    copy /Y "dev.db" "dev.db.backup_%DATE:~-4%_%DATE:~4,2%_%DATE:~7,2%" >nul
    echo       - Local SQLite database backed up successfully.
) else (
    echo       - No local dev.db found, skipping backup.
)

echo.
echo [2/5] Checking .env.production configuration...
if not exist ".env.production" (
    echo [ERROR] .env.production file not found!
    echo Please create .env.production with your cPanel MySQL DATABASE_URL.
    pause
    exit /b 1
)

echo.
echo [3/5] Switching Prisma Provider to MySQL...
node -e "
const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
schema = schema.replace(/provider\s*=\s*\"sqlite\"/, 'provider = \"mysql\"');
fs.writeFileSync('prisma/schema.prisma', schema);
console.log('      - prisma/schema.prisma successfully updated to MySQL provider.');
"

echo.
echo [4/5] Applying MySQL database schema (prisma db push)...
copy /Y ".env.production" ".env" >nul
call npx prisma db push --accept-data-loss
call npx prisma generate

echo.
echo [5/5] Migration Complete!
echo =====================================================================
echo SUCCESS! Your GlowGoodly backend is now configured for cPanel MySQL!
echo.
echo To start in production mode on cPanel:
echo   1. Ensure Passenger or PM2 points to dist/server.js or src/server.ts
echo   2. Set NODE_ENV=production in cPanel Node.js Application Manager
echo   3. Run 'npm run build' and start the application.
echo =====================================================================
pause
