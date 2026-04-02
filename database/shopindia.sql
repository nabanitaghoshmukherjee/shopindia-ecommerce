-- ShopIndia E-Commerce Database Schema for PostgreSQL
-- Run this in pgAdmin to set up your local database

-- Create database (run separately if needed)
-- CREATE DATABASE shopindia;

-- Categories Table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    image TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    price INTEGER NOT NULL DEFAULT 0,
    original_price INTEGER DEFAULT 0,
    rating DECIMAL(2,1) DEFAULT 4.0,
    reviews INTEGER DEFAULT 0,
    image TEXT,
    description TEXT,
    in_stock BOOLEAN DEFAULT TRUE,
    badge VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product Variants Table
CREATE TABLE product_variants (
    id VARCHAR(50) PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    price INTEGER NOT NULL DEFAULT 0,
    stock INTEGER DEFAULT 0,
    image TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    phone VARCHAR(20),
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Addresses Table
CREATE TABLE addresses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255),
    phone VARCHAR(20),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders Table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    total_amount INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    payment_id VARCHAR(100),
    shipping_address JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order Items Table
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    variant_id VARCHAR(50) REFERENCES product_variants(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    price INTEGER NOT NULL,
    product_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cart Items Table (persistent cart)
CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    variant_id VARCHAR(50) REFERENCES product_variants(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id, variant_id)
);

-- Create indexes for better performance
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- Insert sample categories
INSERT INTO categories (name, slug, image) VALUES
('Electronics', 'electronics', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400'),
('Fashion', 'fashion', 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400'),
('Home & Kitchen', 'home-kitchen', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400'),
('Beauty', 'beauty', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400'),
('Sports', 'sports', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400'),
('Books', 'books', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400'),
('Toys', 'toys', 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400'),
('Grocery', 'grocery', 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400');

-- Insert demo user (password: demo123 - should be hashed in production)
INSERT INTO users (email, password, name, phone, is_admin) VALUES
('demo@shopindia.com', 'demo123', 'Demo User', '9876543210', TRUE);

-- Insert sample products
INSERT INTO products (name, category, price, original_price, rating, reviews, image, description, in_stock, badge) VALUES
('Apple iPhone 15 Pro', 'electronics', 134900, 149900, 4.7, 2341, 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400', 'A17 Pro chip, 6.1-inch Super Retina XDR display, Titanium design', TRUE, 'Best Seller'),
('Samsung Galaxy S24 Ultra', 'electronics', 129999, 144999, 4.6, 1876, 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400', 'Snapdragon 8 Gen 3, 200MP camera, S Pen included', TRUE, 'Trending'),
('MacBook Air M2', 'electronics', 89990, 99900, 4.8, 3421, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400', 'M2 chip, 13.6-inch Liquid Retina display, All-day battery life', TRUE, NULL),
('Sony WH-1000XM5', 'electronics', 26990, 32990, 4.7, 5621, 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400', 'Industry-leading noise cancellation, 30-hour battery', TRUE, 'Great Indian Festival'),
('Nike Air Max 270', 'fashion', 8995, 11995, 4.5, 8921, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', 'Men''s Running Shoes, Max Air unit for all-day comfort', TRUE, NULL),
('Adidas Ultraboost 22', 'fashion', 7999, 10999, 4.6, 4521, 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400', 'Men''s Running Shoes, Boost midsole for incredible energy return', TRUE, NULL),
('Puma Regular Fit T-Shirt', 'fashion', 799, 1299, 4.3, 2134, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', 'Cotton blend, Comfortable regular fit', TRUE, NULL),
('Levi''s 511 Slim Fit Jeans', 'fashion', 2299, 3999, 4.4, 7823, 'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=400', 'Slim fit, Stretch denim, Classic 5-pocket style', TRUE, NULL),
('Samsung 65 inch 4K Smart TV', 'home-kitchen', 54999, 79999, 4.5, 1234, 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400', 'Crystal UHD, HDR, Smart Hub, Gaming Mode', TRUE, 'Limited Time Offer'),
('Philips Air Fryer XXL', 'home-kitchen', 12499, 17999, 4.4, 3421, 'https://images.unsplash.com/photo-1589647363585-f4a7d3877b10?w=400', '7.3L capacity, Rapid Air technology, 90% less fat', TRUE, NULL),
('IKEA Poang Armchair', 'home-kitchen', 8990, 12990, 4.3, 892, 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400', 'Comfortable design, Multiple colors available', TRUE, NULL),
('Prestige Cooktop 4 Burner', 'home-kitchen', 4599, 6999, 4.2, 2341, 'https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=400', 'Gas stove, Auto ignition, Stainless steel', TRUE, NULL),
('L''Oreal Paris Serum', 'beauty', 599, 899, 4.4, 12341, 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400', 'Vitamin C serum, Brightening & anti-aging', TRUE, NULL),
('Maybelline Matte Lipstick', 'beauty', 499, 699, 4.5, 8923, 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400', 'Long lasting, 12 shades available', TRUE, NULL),
('Dove Shampoo 1L', 'beauty', 399, 549, 4.3, 15672, 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400', 'Anti-hair fall, Gentle care', TRUE, NULL),
('Nykaa Face Serum', 'beauty', 699, 999, 4.6, 6721, 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400', 'Hyaluronic acid, Hydrating', TRUE, NULL),
('Yoga Mat Premium', 'sports', 899, 1499, 4.5, 4532, 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400', '6mm thickness, Non-slip, Eco-friendly', TRUE, NULL),
('Cricket Bat Kashmir Willow', 'sports', 2199, 3499, 4.4, 2134, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400', 'Premium quality, Lightweight', TRUE, NULL),
('Badminton Racket Set', 'sports', 1299, 2499, 4.3, 3421, 'https://images.unsplash.com/photo-1617083934555-563a14e3665d?w=400', '2 rackets, Shuttlecocks, Full size court', TRUE, NULL),
('Gold''s Gym Dumbbells 10kg', 'sports', 1599, 2299, 4.5, 1892, 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400', 'Cast iron, Hex shape', TRUE, NULL),
('Atomic Habits', 'books', 399, 599, 4.8, 45621, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400', 'James Clear, Transform your life', TRUE, '#1 Bestseller'),
('The Psychology of Money', 'books', 299, 499, 4.7, 28341, 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400', 'Morgan Housel, Timeless lessons', TRUE, NULL),
('Harry Potter Set (7 Books)', 'books', 2499, 3999, 4.9, 67234, 'https://images.unsplash.com/photo-1618666012174-83b441c0bc76?w=400', 'J.K. Rowling, Complete collection', TRUE, NULL),
('CBSE 12th Question Bank', 'books', 599, 899, 4.4, 8923, 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400', 'Physics, Chemistry, Math, 2024-25', TRUE, NULL),
('LEGO City Set', 'toys', 2499, 3499, 4.7, 3421, 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400', '603-piece, City police station', TRUE, NULL),
('Barbie Dreamhouse', 'toys', 8999, 12999, 4.6, 2134, 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400', 'Multistory house, Furniture included', TRUE, NULL),
('Remote Control Car', 'toys', 1999, 3499, 4.4, 4532, 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=400', 'High speed, Rechargeable battery', TRUE, NULL),
('Uno Card Game', 'toys', 199, 399, 4.6, 23421, 'https://images.unsplash.com/photo-1605020420620-20c943cc4669?w=400', 'Classic card game, 2-10 players', TRUE, NULL),
('Basmati Rice 5kg', 'grocery', 899, 1199, 4.5, 12341, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', 'Premium quality, Long grain', TRUE, NULL),
('Tata Tea 1kg', 'grocery', 295, 399, 4.4, 23421, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400', 'Premium blend, Authentic taste', TRUE, NULL),
('Maggi Noodles Pack of 12', 'grocery', 199, 299, 4.3, 34521, 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400', '2-minute noodles, Classic masala', TRUE, NULL),
('Amul Butter 500g', 'grocery', 235, 280, 4.6, 45621, 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400', 'Pure cow milk butter', TRUE, NULL);

-- Insert product variants
INSERT INTO product_variants (id, product_id, name, price, stock) VALUES
('v1', 1, '128GB - Natural Titanium', 134900, 10),
('v2', 1, '256GB - Natural Titanium', 149900, 5),
('v3', 1, '128GB - Blue Titanium', 134900, 8),
('v1', 2, '12GB/256GB - Titanium Black', 129999, 12),
('v2', 2, '12GB/512GB - Titanium Gray', 144999, 7),
('v1', 4, 'Black', 26990, 15),
('v2', 4, 'Silver', 26990, 10),
('v3', 4, 'Midnight Blue', 27990, 8),
('v1', 5, 'White/Black - US 8', 8995, 20),
('v2', 5, 'White/Black - US 9', 8995, 18),
('v3', 5, 'White/Black - US 10', 8995, 15),
('v4', 5, 'Red/White - US 8', 9495, 12),
('v1', 7, 'Red - S', 799, 25),
('v2', 7, 'Red - M', 799, 30),
('v3', 7, 'Red - L', 799, 20),
('v4', 7, 'Blue - S', 799, 15),
('v5', 7, 'Blue - M', 799, 25),
('v1', 8, 'Dark Stonewash - 30', 2299, 15),
('v2', 8, 'Dark Stonewash - 32', 2299, 20),
('v3', 8, 'Light Blue - 30', 2499, 12),
('v1', 11, 'Birch Veneer - White', 8990, 8),
('v2', 11, 'Birch Veneer - Brown', 8990, 6),
('v3', 11, 'Black-Brown', 9490, 5),
('v1', 14, 'Ruby Rush - 655', 499, 50),
('v2', 14, 'Nude Nuance - 820', 499, 45),
('v3', 14, 'Berry Much - 730', 499, 40),
('v4', 14, 'Pink Charge - 915', 499, 35),
('v1', 17, 'Purple - 6mm', 899, 30),
('v2', 17, 'Blue - 6mm', 899, 25),
('v3', 17, 'Pink - 8mm', 1099, 20);

-- Add foreign key for variant product_id
ALTER TABLE product_variants ADD CONSTRAINT fk_product_variants_product 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
