# Hostinger VPS Setup - Step by Step

## Connect to Your VPS

1. Open **Terminal** (Mac/Linux) or **PuTTY** (Windows)
2. Run:
```bash
ssh root@213.210.21.235
```
3. Enter password: `ClO@011#Sh@AvI`

---

## Run These Commands One by One

### Step 1: Update System
```bash
apt update && apt upgrade -y
```

### Step 2: Install Node.js 18
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
node -v
```

### Step 3: Install PostgreSQL
```bash
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql
```

### Step 4: Install PM2 & Nginx
```bash
npm install -g pm2
apt install -y nginx
```

### Step 5: Create Database
```bash
sudo -u postgres psql
```
Then type these commands (one by one):
```sql
CREATE DATABASE shopindia;
CREATE USER shopindia_admin WITH ENCRYPTED PASSWORD 'ShopIndia2024!';
GRANT ALL PRIVILEGES ON DATABASE shopindia TO shopindia_admin;
\q
```

### Step 6: Clone from GitHub
```bash
cd /root
git clone https://github.com/nabanitaghoshmukherjee/shopindia-ecommerce.git
cd shopindia-ecommerce
```

### Step 7: Setup Backend
```bash
cd backend

cat > .env << 'EOF'
PORT=5001
NODE_ENV=production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=shopindia
DB_USER=shopindia_admin
DB_PASSWORD=ShopIndia2024!
JWT_SECRET=shopindia_production_secret_key_2024
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXX
EOF

npm install
```

### Step 8: Run Database Schema
```bash
PGPASSWORD=ShopIndia2024! psql -U shopindia_admin -d shopindia -f ../database/shopindia.sql
```

### Step 9: Start Backend
```bash
pm2 start server-pg.js --name shopindia-api
pm2 save
pm2 startup
```

### Step 10: Build & Deploy Frontend
```bash
cd /root/shopindia-ecommerce/frontend
npm install
npm run build
mkdir -p /var/www/shopindia
cp -r dist/* /var/www/shopindia/
```

### Step 11: Configure Nginx
```bash
cat > /etc/nginx/sites-available/shopindia << 'EOF'
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
EOF

ln -sf /etc/nginx/sites-available/shopindia /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

---

## ✅ Done! Access Your Site

**Frontend:** http://srv855186.hstgr.cloud

**API:** http://srv855186.hstgr.cloud/api

---

## Useful Commands

| Task | Command |
|------|---------|
| Check backend status | `pm2 status` |
| View logs | `pm2 logs shopindia-api` |
| Restart backend | `pm2 restart shopindia-api` |
| Stop backend | `pm2 stop shopindia-api` |
| View Nginx status | `systemctl status nginx` |
| Restart Nginx | `systemctl restart nginx` |

---

## ⚠️ Important - Change These Passwords!

1. **PostgreSQL password** (already set): `ShopIndia2024!`
2. **Root VPS password**: Change via Hostinger panel
3. **JWT Secret in .env**: Change to a random string

---

## Troubleshooting

### Backend not working?
```bash
pm2 logs shopindia-api
```

### Database error?
```bash
sudo -u postgres psql -d shopindia -c "SELECT 1;"
```

### Nginx 502 error?
```bash
pm2 status  # Is backend running?
systemctl restart nginx
```
