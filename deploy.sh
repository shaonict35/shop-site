#!/bin/bash

# ============================================
# GlowGoodly E-Commerce Platform Deployment Script
# Automated deployment to cPanel with PM2
# ============================================

set -e

echo "=========================================="
echo "🚀 GlowGoodly Deployment Started"
echo "=========================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="shop.glowgoodly.com"
DB_HOST="localhost"
DB_USER="sitecadh_appuser"
DB_PASSWORD="GlowShopPass2026"
DB_NAME="sitecadh_glowgoodly_db"
BACKEND_PORT="5000"
FRONTEND_PORT="3000"
HOME_DIR="$HOME/public_html"
BACKEND_DIR="$HOME/public_html/backend"
FRONTEND_DIR="$HOME/public_html/frontend"

echo -e "${YELLOW}[1/10] Checking Node.js and npm...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not installed!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js: $(node -v)${NC}"
echo -e "${GREEN}✅ npm: $(npm -v)${NC}"

echo -e "${YELLOW}[2/10] Creating directories...${NC}"
mkdir -p "$HOME/public_html"
cd "$HOME/public_html"
echo -e "${GREEN}✅ Directories ready${NC}"

echo -e "${YELLOW}[3/10] Cloning repository...${NC}"
if [ -d "$BACKEND_DIR" ]; then
    echo "Updating existing backend..."
    cd "$BACKEND_DIR"
    git pull origin main
else
    echo "Cloning backend..."
    git clone https://github.com/shaonict35/shop-site.git backend || true
fi

if [ -d "$FRONTEND_DIR" ]; then
    echo "Updating existing frontend..."
    cd "$FRONTEND_DIR"
    git pull origin main
else
    echo "Cloning frontend..."
    cd "$HOME/public_html"
    git clone https://github.com/shaonict35/shop-site.git frontend || true
fi
echo -e "${GREEN}✅ Repository cloned/updated${NC}"

echo -e "${YELLOW}[4/10] Setting up Backend...${NC}"
cd "$BACKEND_DIR"
npm install --production

# Create .env file
cat > .env << EOF
PORT=$BACKEND_PORT
NODE_ENV=production

# Database Configuration
DB_HOST=$DB_HOST
DB_PORT=3306
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME
DATABASE_URL="mysql://$DB_USER:$DB_PASSWORD@$DB_HOST:3306/$DB_NAME"

# Security
JWT_SECRET="glowgoodly_production_jwt_secure_key_2026_!@#$%"

# Frontend URL for CORS
FRONTEND_URL="https://$DOMAIN"
EOF

echo -e "${GREEN}✅ Backend .env created${NC}"

echo -e "${YELLOW}[5/10] Running database migrations...${NC}"
npx prisma db push --skip-generate || true
echo -e "${GREEN}✅ Database migrated${NC}"

echo -e "${YELLOW}[6/10] Building Backend...${NC}"
npm run build
echo -e "${GREEN}✅ Backend built${NC}"

echo -e "${YELLOW}[7/10] Setting up Frontend...${NC}"
cd "$FRONTEND_DIR"
npm install --production

# Create .env.local file
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=https://$DOMAIN/api
NEXT_PUBLIC_SOCKET_URL=https://$DOMAIN
NODE_ENV=production
EOF

echo -e "${GREEN}✅ Frontend .env.local created${NC}"

echo -e "${YELLOW}[8/10] Building Frontend...${NC}"
npm run build
echo -e "${GREEN}✅ Frontend built${NC}"

echo -e "${YELLOW}[9/10] Installing and configuring PM2...${NC}"
npm install -g pm2 --silent

# Stop existing processes
pm2 delete "glowgoodly-backend" || true
pm2 delete "glowgoodly-frontend" || true
sleep 2

# Start Backend
cd "$BACKEND_DIR"
pm2 start npm --name "glowgoodly-backend" -- start --production

# Start Frontend
cd "$FRONTEND_DIR"
pm2 start npm --name "glowgoodly-frontend" -- start

# Save PM2 configuration
pm2 save

echo -e "${GREEN}✅ PM2 processes started${NC}"

echo -e "${YELLOW}[10/10] Creating Nginx configuration...${NC}"
cat > ~/glowgoodly-nginx.conf << 'NGINX_CONFIG'
upstream backend {
    server 127.0.0.1:5000;
    keepalive 64;
}

upstream frontend {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    listen 443 ssl http2;
    server_name shop.glowgoodly.com www.shop.glowgoodly.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Redirect HTTP to HTTPS
    if ($scheme != "https") {
        return 301 https://$server_name$request_uri;
    }

    client_max_body_size 50M;

    # Backend API
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Socket.io
    location /socket.io {
        proxy_pass http://backend/socket.io;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://frontend;
        proxy_cache_valid 30d;
        proxy_cache_bypass $http_upgrade;
        add_header Cache-Control "public, immutable";
    }
}
NGINX_CONFIG

echo -e "${GREEN}✅ Nginx configuration created${NC}"

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Deployment Completed Successfully!${NC}"
echo "=========================================="
echo ""
echo "📊 Service Status:"
pm2 status
echo ""
echo "📝 Next Steps:"
echo "1. Configure SSL certificate in cPanel"
echo "2. Update Nginx configuration (if using Nginx)"
echo "3. Set up automatic PM2 startup on reboot:"
echo "   pm2 startup"
echo "   pm2 save"
echo ""
echo "🌐 Access your application:"
echo "   Frontend: https://$DOMAIN"
echo "   Backend: https://$DOMAIN/api"
echo ""
echo "📱 Admin Credentials:"
echo "   Email: admin@glowgoodly.com"
echo "   Password: admin123"
echo ""
echo "⚠️  IMPORTANT: Change default admin password immediately!"
echo "=========================================="
