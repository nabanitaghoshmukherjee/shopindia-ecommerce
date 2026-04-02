#!/bin/bash

# ============================================
# ShopIndia E-Commerce - Auto Deploy Script
# Run: ./deploy.sh
# ============================================

set -e

echo "============================================"
echo "  ShopIndia E-Commerce Deploy Script"
echo "============================================"
echo ""

# Configuration
DB_HOST="31.97.206.7"
DB_PORT="5432"
DB_NAME="shopindia"
DB_USER="postgres"
DB_PASSWORD="Match#2025"
SERVER_NAME="srv855186.hstgr.cloud"
PORT=5001

echo "[1/7] Checking dependencies..."
command -v node >/dev/null 2>&1 || { echo "Installing Node.js..."; curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && apt install -y nodejs; }
command -v pm2 >/dev/null 2>&1 || npm install -g pm2
command -v nginx >/dev/null 2>&1 || apt install -y nginx
echo "✅ Dependencies OK"

echo ""
echo "[2/7] Setting up backend..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/backend"

cat > .env << EOF
PORT=${PORT}
NODE_ENV=production
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT}
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
JWT_SECRET=shopindia_production_secret_key_2024
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXX
EOF

npm install --silent
echo "✅ Backend configured"

echo ""
echo "[3/7] Restarting backend server..."
pm2 stop shopindia-api 2>/dev/null || true
pm2 start server-pg.js --name shopindia-api
pm2 save
echo "✅ Backend running"

echo ""
echo "[4/7] Building frontend..."
cd "$SCRIPT_DIR/frontend"
npm install --silent
npm run build --silent
echo "✅ Frontend built"

echo ""
echo "[5/7] Deploying to web root..."
mkdir -p /var/www/shopindia
rm -rf /var/www/shopindia/*
cp -r dist/* /var/www/shopindia/
echo "✅ Frontend deployed"

echo ""
echo "[6/7] Configuring Nginx..."
cat > /etc/nginx/sites-available/shopindia << EOF
server {
    listen 80;
    server_name ${SERVER_NAME};

    root /var/www/shopindia;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/shopindia /etc/nginx/sites-enabled/shopindia
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
echo "✅ Nginx configured"

echo ""
echo "[7/7] Verifying deployment..."
sleep 2
echo ""
echo "============================================"
echo "  ✅ DEPLOYMENT COMPLETE!"
echo "============================================"
echo ""
echo "🌐 Website: http://${SERVER_NAME}"
echo "🔌 API:    http://${SERVER_NAME}/api"
echo ""
echo "Useful Commands:"
echo "  pm2 status          - Check server status"
echo "  pm2 logs shopindia-api  - View logs"
echo "  pm2 restart shopindia-api - Restart server"
echo "  ./deploy.sh         - Redeploy"
echo ""
echo "============================================"
