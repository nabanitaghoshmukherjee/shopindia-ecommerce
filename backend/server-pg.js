const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const Razorpay = require('razorpay');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'shopindia_secret_key_2024';

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/dist')));

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'shopindia',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

const upload = multer({ 
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    if (ext === '.xlsx' || ext === '.xls' || ext === '.csv') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files allowed'));
    }
  }
});

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_XXXXXXXXXX';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'XXXXXXXXXXXXXXXX';

let razorpay;
try {
  razorpay = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET
  });
} catch (e) {
  console.log('Razorpay not configured');
}

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    let { category, search, sort, minPrice, maxPrice } = req.query;
    let query = 'SELECT p.*, COALESCE(json_agg(pv.*) FILTER (WHERE pv.id IS NOT NULL), \'[]\') as variants FROM products p LEFT JOIN product_variants pv ON p.id = pv.product_id';
    let conditions = [];
    let params = [];
    let paramCount = 0;

    if (category) {
      paramCount++;
      conditions.push(`p.category = $${paramCount}`);
      params.push(category);
    }
    if (search) {
      paramCount++;
      conditions.push(`(LOWER(p.name) LIKE $${paramCount} OR LOWER(p.description) LIKE $${paramCount})`);
      params.push(`%${search.toLowerCase()}%`);
    }
    if (minPrice) {
      paramCount++;
      conditions.push(`p.price >= $${paramCount}`);
      params.push(parseInt(minPrice));
    }
    if (maxPrice) {
      paramCount++;
      conditions.push(`p.price <= $${paramCount}`);
      params.push(parseInt(maxPrice));
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' GROUP BY p.id';

    if (sort === 'price-asc') query += ' ORDER BY p.price ASC';
    else if (sort === 'price-desc') query += ' ORDER BY p.price DESC';
    else if (sort === 'rating') query += ' ORDER BY p.rating DESC';
    else query += ' ORDER BY p.id';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/admin/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/admin/categories', async (req, res) => {
  try {
    const { name, image } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const result = await pool.query(
      'INSERT INTO categories (name, slug, image) VALUES ($1, $2, $3) RETURNING *',
      [name, slug, image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.put('/api/admin/categories/:id', async (req, res) => {
  try {
    const { name, image } = req.body;
    const slug = name ? name.toLowerCase().replace(/\s+/g, '-') : null;
    const result = await pool.query(
      'UPDATE categories SET name = COALESCE($1, name), slug = COALESCE($2, slug), image = COALESCE($3, image), updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [name, slug, image, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Category not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.delete('/api/admin/categories/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Category not found' });
    res.json({ message: 'Category deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/admin/products/bulk', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  
  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    
    const addedProducts = [];
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (row.name && row.category && row.price) {
        const result = await pool.query(
          `INSERT INTO products (name, category, price, original_price, rating, reviews, image, description, in_stock, badge) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
          [
            row.name,
            row.category,
            parseInt(row.price) || 0,
            parseInt(row.originalPrice) || parseInt(row.price) || 0,
            parseFloat(row.rating) || 4.0,
            parseInt(row.reviews) || 0,
            row.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
            row.description || '',
            row.inStock !== undefined ? (row.inStock === 'true' || row.inStock === true) : true,
            row.badge || null
          ]
        );
        const productId = result.rows[0].id;
        addedProducts.push({ id: productId, name: row.name });
      }
    }
    
    res.json({ 
      message: `Successfully added ${addedProducts.length} products`,
      count: addedProducts.length,
      products: addedProducts
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process file', details: err.message });
  }
});

app.get('/api/admin/products/sample', (req, res) => {
  const sampleData = [
    { 
      name: 'Sample T-Shirt', 
      category: 'fashion', 
      price: 999, 
      originalPrice: 1299, 
      rating: 4.5, 
      reviews: 100, 
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', 
      description: 'Comfortable cotton t-shirt', 
      inStock: true, 
      badge: 'New' 
    },
    { 
      name: 'Sample Phone Case', 
      category: 'electronics', 
      price: 299, 
      originalPrice: 499, 
      rating: 4.2, 
      reviews: 50, 
      image: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400', 
      description: 'Protective phone case', 
      inStock: true, 
      badge: '' 
    }
  ];
  
  const ws = xlsx.utils.json_to_sheet(sampleData);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, 'Products');
  
  const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
  
  res.setHeader('Content-Disposition', 'attachment; filename=sample_products.xlsx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, COALESCE(json_agg(pv.*) FILTER (WHERE pv.id IS NOT NULL), '[]') as variants 
       FROM products p LEFT JOIN product_variants pv ON p.id = pv.product_id 
       WHERE p.id = $1 GROUP BY p.id`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { name, category, price, originalPrice, rating, reviews, image, description, inStock, badge } = req.body;
    
    if (!name || !category || !price) {
      return res.status(400).json({ error: 'Name, category, and price are required' });
    }

    const result = await pool.query(
      `INSERT INTO products (name, category, price, original_price, rating, reviews, image, description, in_stock, badge) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        name,
        category,
        parseInt(price),
        parseInt(originalPrice) || parseInt(price),
        parseFloat(rating) || 4.0,
        parseInt(reviews) || 0,
        image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
        description || '',
        inStock !== undefined ? inStock : true,
        badge || null
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/products/:id/variants', async (req, res) => {
  try {
    const productId = req.params.id;
    const { name, price, stock, image } = req.body;
    
    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Name and price are required' });
    }
    
    const variantId = 'v' + Date.now();
    const result = await pool.query(
      'INSERT INTO product_variants (id, product_id, name, price, stock, image) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [variantId, productId, name, parseInt(price), parseInt(stock) || 0, image || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.put('/api/products/:id/variants/:variantId', async (req, res) => {
  try {
    const { name, price, stock, image } = req.body;
    
    const result = await pool.query(
      `UPDATE product_variants SET 
       name = COALESCE($1, name), 
       price = COALESCE($2, price), 
       stock = COALESCE($3, stock), 
       image = COALESCE($4, image) 
       WHERE id = $5 AND product_id = $6 RETURNING *`,
      [name, price, stock, image, req.params.variantId, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Variant not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.delete('/api/products/:id/variants/:variantId', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM product_variants WHERE id = $1 AND product_id = $2 RETURNING *',
      [req.params.variantId, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Variant not found' });
    res.json({ message: 'Variant deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    const result = await pool.query(
      'INSERT INTO users (email, password, name, phone) VALUES ($1, $2, $3, $4) RETURNING id, email, name',
      [email, password, name, phone]
    );
    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query(
      'SELECT id, email, password, name FROM users WHERE email = $1 AND password = $2',
      [email, password]
    );
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/auth/profile', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, phone FROM users WHERE id = $1',
      [req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/cart', authMiddleware, async (req, res) => {
  try {
    const cartResult = await pool.query(
      `SELECT ci.*, p.*, pv.name as variant_name, pv.price as variant_price, pv.stock as variant_stock
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       LEFT JOIN product_variants pv ON ci.variant_id = pv.id
       WHERE ci.user_id = $1`,
      [req.userId]
    );
    res.json(cartResult.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/cart/add', authMiddleware, async (req, res) => {
  try {
    const { productId, quantity = 1, variantId } = req.body;
    
    const existing = await pool.query(
      'SELECT * FROM cart_items WHERE user_id = $1 AND product_id = $2 AND COALESCE(variant_id, \'\') = COALESCE($3, \'\')',
      [req.userId, productId, variantId]
    );
    
    if (existing.rows.length > 0) {
      await pool.query(
        'UPDATE cart_items SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [quantity, existing.rows[0].id]
      );
    } else {
      await pool.query(
        'INSERT INTO cart_items (user_id, product_id, variant_id, quantity) VALUES ($1, $2, $3, $4)',
        [req.userId, productId, variantId || null, quantity]
      );
    }
    
    const cartResult = await pool.query(
      `SELECT ci.*, p.*, pv.name as variant_name, pv.price as variant_price, pv.stock as variant_stock
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       LEFT JOIN product_variants pv ON ci.variant_id = pv.id
       WHERE ci.user_id = $1`,
      [req.userId]
    );
    res.json(cartResult.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.put('/api/cart/update', authMiddleware, async (req, res) => {
  try {
    const { productId, quantity, variantId } = req.body;
    await pool.query(
      'UPDATE cart_items SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 AND product_id = $3 AND COALESCE(variant_id, \'\') = COALESCE($4, \'\')',
      [quantity, req.userId, productId, variantId]
    );
    
    const cartResult = await pool.query(
      `SELECT ci.*, p.*, pv.name as variant_name, pv.price as variant_price, pv.stock as variant_stock
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       LEFT JOIN product_variants pv ON ci.variant_id = pv.id
       WHERE ci.user_id = $1`,
      [req.userId]
    );
    res.json(cartResult.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.delete('/api/cart/remove/:productId/:variantId?', authMiddleware, async (req, res) => {
  try {
    const variantId = req.params.variantId;
    if (variantId) {
      await pool.query(
        'DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2 AND variant_id = $3',
        [req.userId, req.params.productId, variantId]
      );
    } else {
      await pool.query(
        'DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2 AND variant_id IS NULL',
        [req.userId, req.params.productId]
      );
    }
    
    const cartResult = await pool.query(
      `SELECT ci.*, p.*, pv.name as variant_name, pv.price as variant_price, pv.stock as variant_stock
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       LEFT JOIN product_variants pv ON ci.variant_id = pv.id
       WHERE ci.user_id = $1`,
      [req.userId]
    );
    res.json(cartResult.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/orders', authMiddleware, async (req, res) => {
  try {
    const { items, address, paymentId } = req.body;
    
    const totalAmount = items.reduce((sum, item) => {
      return sum + ((item.variant?.price || item.product?.price || 0) * item.quantity);
    }, 0);
    
    const orderResult = await pool.query(
      'INSERT INTO orders (user_id, total_amount, status, payment_id, shipping_address) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.userId, totalAmount, 'Confirmed', paymentId || 'DEMO_' + Date.now(), JSON.stringify(address)]
    );
    
    const order = orderResult.rows[0];
    
    for (const item of items) {
      await pool.query(
        'INSERT INTO order_items (order_id, product_id, variant_id, quantity, price, product_data) VALUES ($1, $2, $3, $4, $5, $6)',
        [order.id, item.productId, item.variantId || null, item.quantity, item.variant?.price || item.product?.price || 0, JSON.stringify(item.product || item)]
      );
    }
    
    await pool.query('DELETE FROM cart_items WHERE user_id = $1', [req.userId]);
    
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/orders', authMiddleware, async (req, res) => {
  try {
    const ordersResult = await pool.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    
    const orders = [];
    for (const order of ordersResult.rows) {
      const itemsResult = await pool.query(
        `SELECT oi.*, p.name as product_name, p.image as product_image, pv.name as variant_name
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         LEFT JOIN product_variants pv ON oi.variant_id = pv.id
         WHERE oi.order_id = $1`,
        [order.id]
      );
      orders.push({ ...order, items: itemsResult.rows });
    }
    
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/orders/:id', authMiddleware, async (req, res) => {
  try {
    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (orderResult.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    
    const itemsResult = await pool.query(
      `SELECT oi.*, p.name as product_name, p.image as product_image, pv.name as variant_name
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       LEFT JOIN product_variants pv ON oi.variant_id = pv.id
       WHERE oi.order_id = $1`,
      [req.params.id]
    );
    
    res.json({ ...orderResult.rows[0], items: itemsResult.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/payments/create-order', authMiddleware, (req, res) => {
  const { amount } = req.body;
  
  if (razorpay && RAZORPAY_KEY_ID !== 'rzp_test_XXXXXXXXXX') {
    razorpay.orders.create({
      amount: amount * 100,
      currency: 'INR',
      receipt: `order_${Date.now()}`
    }).then(order => {
      res.json(order);
    }).catch(err => {
      res.status(500).json({ error: 'Razorpay error', details: err.message });
    });
  } else {
    const mockOrder = {
      id: 'order_demo_' + Date.now(),
      entity: 'order',
      amount: amount * 100,
      amount_paid: 0,
      amount_due: amount * 100,
      currency: 'INR',
      receipt: 'receipt_' + Date.now(),
      status: 'created'
    };
    res.json(mockOrder);
  }
});

app.post('/api/payments/verify', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  
  if (!razorpay_order_id || !razorpay_payment_id) {
    const success = true;
    res.json({ success, paymentId: 'DEMO_' + Date.now() });
    return;
  }
  
  const crypto = require('crypto');
  const signature = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(razorpay_order_id + '|' + razorpay_payment_id)
    .digest('hex');

  if (signature === razorpay_signature) {
    res.json({ success: true });
  } else {
    res.status(400).json({ success: false, error: 'Invalid signature' });
  }
});

app.get('/api/config', (req, res) => {
  res.json({ keyId: RAZORPAY_KEY_ID });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const HOST = process.env.HOST || '0.0.0.0';

pool.query('SELECT NOW()').then(() => {
  console.log('Database connected successfully');
  app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
  });
}).catch(err => {
  console.error('Database connection failed:', err);
  console.log('Server starting without database connection...');
  app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT} (NO DATABASE)`);
  });
});
