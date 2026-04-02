#!/bin/bash

# ShopIndia E-Commerce - Hostinger VPS Setup Script
# Run this on your Hostinger VPS after connecting via SSH

echo "=========================================="
echo "ShopIndia E-Commerce VPS Setup"
echo "=========================================="

# Update system
echo "[1/8] Updating system packages..."
apt update && apt upgrade -y

# Install Node.js 18
echo "[2/8] Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install PostgreSQL
echo "[3/8] Installing PostgreSQL..."
apt install -y postgresql postgresql-contrib

# Start PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Install PM2 globally
echo "[4/8] Installing PM2..."
npm install -g pm2

# Install Nginx
echo "[5/8] Installing Nginx..."
apt install -y nginx

# Create database
echo "[6/8] Setting up PostgreSQL database..."
sudo -u postgres psql << EOF
CREATE DATABASE shopindia;
CREATE USER shopindia_admin WITH ENCRYPTED PASSWORD 'ShopIndia2024!';
GRANT ALL PRIVILEGES ON DATABASE shopindia TO shopindia_admin;
\q
EOF

# Clone repository
echo "[7/8] Cloning from GitHub..."
cd /root
git clone https://github.com/nabanitaghoshmukherjee/shopindia-ecommerce.git
cd shopindia-ecommerce

# Setup backend
echo "[8/8] Configuring backend..."
cd backend

# Create .env file
cat > .env << 'ENVEOF'
PORT=5001
NODE_ENV=production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=shopindia
DB_USER=shopindia_admin
DB_PASSWORD=ShopIndia2024!
JWT_SECRET=shopindia_production_secret_key_change_me
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXX
ENVEOF

# Install dependencies
npm install

# Run database schema
PGPASSWORD=ShopIndia2024! psql -U shopindia_admin -d shopindia -f ../database/shopindia.sql

# Start backend with PM2
pm2 start server-pg.js --name shopindia-api
pm2 save
pm2 startup

# Build frontend
cd ../frontend
npm install
npm run build

# Move frontend to web root
mkdir -p /var/www/shopindia
mv dist/* /var/www/shopindia/

# Configure Nginx
cat > /etc/nginx/sites-available/shopindia << 'NGINXEOF'
server {
    listen 80;
    server_name srv855186.hstgr.cloud;

    root /var/www/shopindia;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINXEOF

# Enable site
ln -sf /etc/nginx/sites-available/shopindia /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
nginx -t
systemctl restart nginx

echo ""
echo "=========================================="
echo "✅ SETUP COMPLETE!"
echo "=========================================="
echo ""
echo "🌐 Access your site:"
echo "   http://srv855186.hstgr.cloud"
echo ""
echo "🔧 Backend API:"
echo "   http://srv855186.hstgr.cloud/api"
echo ""
echo "📊 PM2 Status:"
echo "   pm2 status"
echo ""
echo "📝 View logs:"
echo "   pm2 logs shopindia-api"
echo ""
echo "=========================================="
echo "⚠️  IMPORTANT: Change your passwords!"
echo "=========================================="
