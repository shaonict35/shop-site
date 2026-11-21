@echo off
TITLE GlowGoodly - Switch to Local SQLite Tool
COLOR 0B

echo =====================================================================
echo         GLOWGOODLY - SWITCH BACK TO LOCAL SQLITE DATABASE
echo =====================================================================
echo.
echo [1/3] Switching Prisma Provider back to SQLite...
node -e "
const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
schema = schema.replace(/provider\s*=\s*\"mysql\"/, 'provider = \"sqlite\"');
fs.writeFileSync('prisma/schema.prisma', schema);
console.log('      - prisma/schema.prisma successfully updated to SQLite provider.');
"

echo.
echo [2/3] Restoring local dev environment variables...
node -e "
const fs = require('fs');
let env = fs.readFileSync('.env', 'utf8');
env = env.replace(/DATABASE_URL=\".*\"/, 'DATABASE_URL=\"file:./dev.db\"');
env = env.replace(/NODE_ENV=production/, 'NODE_ENV=development');
fs.writeFileSync('.env', env);
console.log('      - .env updated to local dev.db SQLite.');
"

echo.
echo [3/3] Synchronizing SQLite database...
call npx prisma db push
call npx prisma generate

echo.
echo SUCCESS! Your backend is now running on local SQLite (dev.db)!
pause
