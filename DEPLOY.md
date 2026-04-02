# Deploy to GitHub & Hostinger

## Part 1: Push to GitHub

### Step 1.1: Create GitHub Repository

1. Go to [GitHub](https://github.com)
2. Login with `nabanitaghoshmukherjee2@gmail.com`
3. Click **"+"** → **"New repository"**
4. Settings:
   - Name: `shopindia-ecommerce`
   - Description: `Full-featured e-commerce platform`
   - Public/Private: Your choice
   - **DO NOT** check "Add a README file" (we already have one)
5. Click **"Create repository"**

### Step 1.2: Push Code to GitHub

Run these commands (replace with your actual GitHub username):

```bash
git remote add origin https://github.com/YOUR_USERNAME/shopindia-ecommerce.git
git branch -M main
git push -u origin main
```

You'll be asked to login to GitHub. Use your email and a Personal Access Token (not password).

---

## Part 2: Deploy on Hostinger

### Option A: Deploy Frontend (Static) on Hostinger

#### Step 2A.1: Build the Frontend

```bash
cd frontend
npm run build
```

This creates a `dist/` folder with static files.

#### Step 2A.2: Upload to Hostinger

1. Login to [Hostinger hPanel](https://hpanel.hostinger.com)
2. Go to **Files** → **File Manager**
3. Navigate to `public_html`
4. Upload contents of `dist/` folder

### Option B: Full Stack Deploy on Hostinger (Recommended)

#### Step 2B.1: Get Hostinger VPS or Premium Hosting

- **Shared Hosting**: Good for frontend only
- **VPS**: Required for Node.js backend + PostgreSQL

#### Step 2B.2: Connect to Hostinger via SSH

1. In Hostinger hPanel → **Advanced** → **SSH Access**
2. Get your SSH credentials
3. Connect using PuTTY (Windows) or Terminal (Mac/Linux):

```bash
ssh username@your-server-ip
```

#### Step 2B.3: Set up on Hostinger Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install PM2 (for running Node.js in background)
npm install -g pm2

# Clone from GitHub
git clone https://github.com/YOUR_USERNAME/shopindia-ecommerce.git
cd shopindia-ecommerce
```

#### Step 2B.4: Set up Database

```bash
# Switch to postgres user
sudo -u postgres psql

# In psql terminal:
CREATE DATABASE shopindia;
CREATE USER shopindia_admin WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE shopindia TO shopindia_admin;
\q

# Run database schema
psql -U shopindia_admin -d shopindia -f database/shopindia.sql
```

#### Step 2B.5: Configure and Start Backend

```bash
cd backend

# Create .env file
cat > .env << EOF
PORT=5001
NODE_ENV=production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=shopindia
DB_USER=shopindia_admin
DB_PASSWORD=your_password
JWT_SECRET=your_super_secret_key_here
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
EOF

# Install dependencies
npm install

# Start with PM2
pm2 start server-pg.js --name shopindia-api

# Save PM2 process list
pm2 save

# Setup startup script
pm2 startup
```

#### Step 2B.6: Build & Serve Frontend

```bash
cd ../frontend
npm install
npm run build

# Move dist to web root
sudo mv dist/* /var/www/html/
```

#### Step 2B.7: Configure Nginx (Reverse Proxy)

```bash
sudo apt install -y nginx

sudo nano /etc/nginx/sites-available/default
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend (static files)
    root /var/www/html;
    index index.html;

    # Backend API proxy
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 2B.8: Setup SSL (HTTPS)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Part 3: Domain Configuration

1. In Hostinger → **Domains** → **DNS Zone**
2. Add these records:
   - **A Record**: `@` → Your server IP
   - **CNAME**: `www` → `@`

---

## Quick Commands Reference

| Action | Command |
|--------|---------|
| Check backend status | `pm2 status` |
| View backend logs | `pm2 logs shopindia-api` |
| Restart backend | `pm2 restart shopindia-api` |
| Pull latest changes | `git pull origin main` |
| Rebuild frontend | `npm run build && sudo mv dist/* /var/www/html/` |

---

## Troubleshooting

### Backend not starting?
```bash
pm2 logs shopindia-api
# Check for errors
```

### Database connection failed?
```bash
sudo -u postgres psql -d shopindia -c "SELECT 1;"
```

### Nginx 502 Bad Gateway?
- Check if backend is running: `pm2 status`
- Check nginx logs: `sudo tail -f /var/log/nginx/error.log`

---

## Support

For Hostinger support: [Hostinger Help Center](https://www.hostinger.com/help)
