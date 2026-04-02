# ShopIndia E-Commerce Platform

A full-featured e-commerce platform built with React, Node.js, Express, and PostgreSQL.

## Features

- 🛒 Product catalog with categories
- 👤 User authentication (Register/Login)
- 🛍️ Shopping cart functionality
- 💳 Payment integration (Razorpay)
- 📦 Order management
- 📱 Responsive design
- 🔐 Admin panel

## Tech Stack

**Frontend:**
- React.js
- Vite
- Context API (State Management)

**Backend:**
- Node.js
- Express.js
- PostgreSQL
- JWT Authentication

## Quick Start

### Prerequisites

- Node.js v16+
- PostgreSQL
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd shopindia
```

2. Set up PostgreSQL database:
   - Create database `shopindia`
   - Run `database/shopindia.sql`

3. Configure backend:
```bash
cd backend
cp .env.example .env  # or create .env with your settings
npm install
```

4. Configure frontend:
```bash
cd ../frontend
npm install
```

5. Start development servers:
```bash
# Terminal 1 - Backend
cd backend
npm run start:pg

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## Demo Credentials

- **Email:** demo@shopindia.com
- **Password:** demo123

## License

This project is available for commercial use. See LICENSING.md for details.

## Author

Nabanita Ghosh Mukherjee (nabanitaghoshmukherjee@gmail.com)
