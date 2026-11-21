#!/bin/bash
set -e

echo "====================================================================="
echo "          GLOWGOODLY - ONE-CLICK CPANEL MYSQL MIGRATION"
echo "====================================================================="
echo ""

echo "[1/5] Backing up local SQLite database..."
if [ -f "dev.db" ]; then
    cp dev.db "dev.db.backup_$(date +%Y%m%d_%H%M%S)"
    echo "      - Local SQLite database backed up successfully."
else
    echo "      - No local dev.db found, skipping backup."
fi

echo ""
echo "[2/5] Checking .env.production configuration..."
if [ ! -f ".env.production" ]; then
    echo "[ERROR] .env.production file not found!"
    echo "Please create .env.production with your cPanel MySQL DATABASE_URL."
    exit 1
fi

echo ""
echo "[3/5] Switching Prisma Provider to MySQL..."
node -e "
const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
schema = schema.replace(/provider\s*=\s*\"sqlite\"/, 'provider = \"mysql\"');
fs.writeFileSync('prisma/schema.prisma', schema);
console.log('      - prisma/schema.prisma successfully updated to MySQL provider.');
"

echo ""
echo "[4/5] Applying MySQL database schema (prisma db push)..."
cp .env.production .env
npx prisma db push --accept-data-loss
npx prisma generate

echo ""
echo "[5/5] Migration Complete!"
echo "====================================================================="
echo "SUCCESS! Your GlowGoodly backend is now configured for cPanel MySQL!"
echo "====================================================================="
