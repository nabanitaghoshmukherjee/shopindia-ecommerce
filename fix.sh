#!/bin/bash

# =============================================
# ShopIndia - Complete Fix Script
# Run: bash fix.sh
# =============================================

echo "============================================"
echo "  ShopIndia - Complete Fix"
echo "============================================"
echo ""

PROJECT_DIR="/home/ubuntu/dev/shopindia-ecommerce"

echo "[1/6] Updating server code..."
cd $PROJECT_DIR
git pull

echo ""
echo "[2/6] Installing backend dependencies..."
cd $PROJECT_DIR/backend
npm install

echo ""
echo "[3/6] Configuring .env..."
cat > .env << 'EOF'
HOST=0.0.0.0
PORT=5001
NODE_ENV=production
DB_HOST=31.97.206.7
DB_PORT=5432
DB_NAME=shopindia
DB_USER=postgres
DB_PASSWORD=Match#2025
DIST_PATH=/home/ubuntu/dev/shopindia-ecommerce/frontend/dist
JWT_SECRET=shopindia_production_secret_key_2024
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXX
EOF
echo "✅ .env configured"

echo ""
echo "[4/6] Building frontend..."
cd $PROJECT_DIR/frontend
npm install
npm run build
echo "✅ Frontend built"

echo ""
echo "[5/6] Starting/restarting backend..."
cd $PROJECT_DIR/backend
pm2 stop shopindia-api 2>/dev/null || true
pm2 start server-pg.js --name shopindia-api
pm2 save

echo ""
echo "[6/6] Testing..."
sleep 3

# Test API
echo -n "API Test: "
API_RESULT=$(curl -s http://localhost:5001/api/categories)
if [[ $API_RESULT == *"Electronics"* ]]; then
    echo "✅ Working"
else
    echo "❌ Failed"
fi

# Test Frontend
echo -n "Frontend Test: "
FRONTEND_RESULT=$(curl -s http://localhost:5001)
if [[ $FRONTEND_RESULT == *"<!DOCTYPE html>"* ]] || [[ $FRONTEND_RESULT == *"<div"* ]]; then
    echo "✅ Working"
else
    echo "❌ Failed"
fi

echo ""
echo "============================================"
echo "  ✅ FIX COMPLETE!"
echo "============================================"
echo ""
echo "🌐 Access your site:"
echo "   http://srv855186.hstgr.cloud:5001"
echo ""
echo "pm2 status"
pm2 status
echo ""
echo "============================================"
