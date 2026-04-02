# ShopIndia - E-Commerce Platform Specification

## 1. Project Overview

- **Project Name**: ShopIndia (Amazon-like e-commerce platform)
- **Project Type**: Full-stack web application
- **Core Functionality**: Multi-vendor marketplace with product browsing, cart management, user authentication, and secure payments via Razorpay
- **Target Users**: Indian consumers looking to buy products online

## 2. Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: In-memory (JSON file-based for simplicity)
- **Authentication**: JWT tokens
- **Payment Gateway**: Razorpay (India)

### Frontend
- **Framework**: React 18 with Vite
- **Routing**: React Router v6
- **State Management**: React Context + useReducer
- **Styling**: CSS Modules with custom design system
- **HTTP Client**: Axios

## 3. UI/UX Specification

### Color Palette
- **Primary**: #FF9900 (Amazon Orange)
- **Secondary**: #232F3E (Amazon Dark Blue)
- **Accent**: #00A8E1 (Sky Blue)
- **Success**: #007600 (Green)
- **Error**: #D62626 (Red)
- **Background**: #FFFFFF
- **Surface**: #F3F3F3
- **Text Primary**: #111111
- **Text Secondary**: #555555
- **Border**: #DDD

### Typography
- **Font Family**: "Amazon Ember", "Arial", sans-serif
- **Headings**: 
  - H1: 28px, bold
  - H2: 24px, bold
  - H3: 20px, bold
- **Body**: 14px, regular
- **Small**: 12px, regular

### Layout Structure

#### Header
- Logo (left)
- Search bar (center, with category dropdown)
- User menu (right): Account, Orders, Cart with badge

#### Footer
- 4 columns: Get to Know Us, Connect with Us, Make Money with Us, Payment Products
- Copyright text

### Responsive Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## 4. Pages & Components

### Pages
1. **Home Page** - Hero banner, category cards, product grids
2. **Product Listing** - Filter sidebar, product grid with sorting
3. **Product Detail** - Image gallery, price, add to cart
4. **Cart** - Item list, quantity adjustment, checkout button
5. **Checkout** - Address form, order summary, Razorpay payment
6. **Order Success** - Order confirmation details
7. **Login/Register** - Authentication forms
8. **User Dashboard** - Order history, profile

### Components
- Navbar
- ProductCard
- CategoryCard
- CartItem
- SearchBar
- PriceDisplay
- Button (primary, secondary, outline)
- Input (text, email, password, number)
- Modal
- Toast notifications

## 5. Backend API Specification

### Endpoints

#### Products
- `GET /api/products` - List all products (with filters)
- `GET /api/products/:id` - Get single product
- `GET /api/categories` - List categories

#### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/update` - Update quantity
- `DELETE /api/cart/remove/:productId` - Remove item

#### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get order details

#### Auth
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile

#### Payments
- `POST /api/payments/create-order` - Create Razorpay order
- `POST /api/payments/verify` - Verify payment signature

## 6. Dummy Data

### Categories (8)
1. Electronics - Mobiles, Laptops, Accessories
2. Fashion - Men's, Women's, Kids
3. Home & Kitchen - Furniture, Appliances
4. Beauty - Skincare, Makeup, Fragrances
5. Sports - Fitness, Outdoor, Sportswear
6. Books - Fiction, Non-fiction, Educational
7. Toys - Games, Puzzles, Action Figures
8. Grocery - Staples, Snacks, Beverages

### Products (30+)
- Mix of Indian and international brands
- Realistic Indian pricing (₹99 - ₹1,50,000)
- Product images from placeholder services

### Users
- Pre-seeded demo user: demo@shopindia.com / demo123

## 7. Payment Integration

### Razorpay
- Test Mode API Key
- Support for:
  - UPI
  - Debit/Credit Cards
  - Net Banking
  - Wallets

## 8. Acceptance Criteria

1. ✅ Home page displays hero banner and product categories
2. ✅ Products can be browsed by category
3. ✅ Product detail page shows all information
4. ✅ Cart allows adding, updating, removing items
5. ✅ Checkout flow with address form
6. ✅ Razorpay payment integration works in test mode
7. ✅ Order confirmation page shows order details
8. ✅ User authentication (login/register) works
9. ✅ Responsive design works on mobile/tablet/desktop
10. ✅ No console errors on page load
