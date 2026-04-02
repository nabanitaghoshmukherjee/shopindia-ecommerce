# ShopIndia E-Commerce - Local Setup Guide

## Prerequisites

1. **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
2. **PostgreSQL** - [Download](https://www.postgresql.org/download/)
3. **pgAdmin** (optional) - Comes with PostgreSQL or [standalone](https://www.pgadmin.org/)

---

## Step 1: Install PostgreSQL & Create Database

### Option A: Using pgAdmin

1. Open **pgAdmin 4**
2. Right-click on **Servers** → **Create** → **Server**
3. Fill in connection details:
   - Host: `localhost`
   - Port: `5432`
   - Username: `postgres` (or your username)
   - Password: (your password)

4. Right-click on **Databases** → **Create** → **Database**
5. Name: `shopindia`
6. Click **Save**

### Option B: Using Command Line

```bash
psql -U postgres
CREATE DATABASE shopindia;
\q
```

---

## Step 2: Run Database Schema

### Option A: Using pgAdmin

1. Open pgAdmin
2. Expand: `Servers` → `PostgreSQL` → `Databases` → `shopindia`
3. Right-click on `shopindia` → **Query Tool** (or press Ctrl+E)
4. Open and copy contents from: `database/shopindia.sql`
5. Paste into Query Tool
6. Click **Execute** (or press F5)

### Option B: Using Command Line

```bash
psql -U postgres -d shopindia -f database/shopindia.sql
```

---

## Step 3: Install Backend Dependencies

```bash
cd ecommerce/backend
npm install
```

---

## Step 4: Configure Environment

Edit `backend/.env` file with your PostgreSQL credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=shopindia
DB_USER=postgres
DB_PASSWORD=your_password_here
JWT_SECRET=your_secret_key_here
```

---

## Step 5: Start Backend Server

### With PostgreSQL Database (Recommended):
```bash
cd ecommerce/backend
npm run start:pg
```

### Without Database (In-Memory - for testing):
```bash
cd ecommerce/backend
npm start
```

---

## Step 6: Start Frontend

```bash
cd ecommerce/frontend
npm install
npm run dev
```

---

## Step 7: Access Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5001

### Demo Login:
- Email: `demo@shopindia.com`
- Password: `demo123`

---

## Offline Usage

This application works **100% offline**:

1. **Backend** runs locally on your machine
2. **Database** runs on your local PostgreSQL server
3. **Frontend** runs locally (no external API calls except images)

### Note on Images:
Product images use Unsplash URLs. For true offline mode:
1. Download images locally
2. Update product table with local paths
3. Serve static files from backend

---

## File Structure

```
ecommerce/
├── backend/
│   ├── server.js           # In-memory version
│   ├── server-pg.js         # PostgreSQL version
│   ├── package.json
│   ├── .env                # Environment variables
│   └── node_modules/
├── frontend/
│   ├── src/
│   │   ├── pages/          # React components
│   │   ├── components/
│   │   └── context/
│   ├── package.json
│   └── node_modules/
├── database/
│   └── shopindia.sql       # Database schema + sample data
└── README.md               # This file
```

---

## Troubleshooting

### Database Connection Error
- Check PostgreSQL service is running
- Verify credentials in `.env` file
- Ensure database `shopindia` exists

### Port Already in Use
- Change PORT in `.env` to a different number (e.g., 5002)

### CORS Error
- Backend and frontend must run on different ports
- Frontend proxies API calls to backend

---

## Need Help?

The application uses:
- **Express.js** for backend API
- **React** for frontend
- **PostgreSQL** for database
- **JWT** for authentication
