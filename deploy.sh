#!/bin/bash

# ============================================
# ShopIndia E-Commerce - Simple Deploy Script
# Serves everything from Node.js backend
# ============================================

set -e

echo "============================================"
echo "  ShopIndia E-Commerce Deploy"
echo "============================================"
echo ""

# Configuration
DB_HOST="31.97.206.7"
DB_PORT="5432"
DB_NAME="shopindia"
DB_USER="postgres"
DB_PASSWORD="FGrt4Vfe3234"
PORT=5001

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST_PATH="$SCRIPT_DIR/frontend/dist"

echo "[1/4] Setting up backend..."
cd "$SCRIPT_DIR/backend"

cat > .env << EOF
HOST=0.0.0.0
PORT=${PORT}
NODE_ENV=production
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT}
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DIST_PATH=${DIST_PATH}
JWT_SECRET=shopindia_production_secret_key_2024
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXX
EOF

npm install --silent
echo "✅ Backend configured"

echo ""
echo "[2/4] Building frontend..."
cd "$SCRIPT_DIR/frontend"
npm install --silent
npm run build --silent
echo "✅ Frontend built"

echo ""
echo "[3/4] Restarting server..."
cd "$SCRIPT_DIR/backend"

pm2 stop shopindia-api 2>/dev/null || true
pm2 start server-pg.js --name shopindia-api
pm2 save
sleep 2
echo "✅ Server restarted"

echo ""
echo "[4/4] Configuring Nginx..."
cat > /etc/nginx/sites-available/shopindia << EOF
server {
    listen 80;
    server_name srv855186.hstgr.cloud;

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/shopindia /etc/nginx/sites-enabled/shopindia
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
echo "✅ Nginx configured"

echo ""
echo "============================================"
echo "  ✅ DEPLOYMENT COMPLETE!"
echo "============================================"
echo ""
echo "🌐 Website: http://srv855186.hstgr.cloud"
echo ""
echo "Commands:"
echo "  pm2 status              - Check status"
echo "  pm2 logs shopindia-api  - View logs"
echo "  pm2 restart shopindia-api - Restart"
echo ""
echo "============================================"
