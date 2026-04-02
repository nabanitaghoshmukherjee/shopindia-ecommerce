const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const Razorpay = require('razorpay');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');

const app = express();
const PORT = 5001;
const JWT_SECRET = 'shopindia_secret_key_2024';

app.use(cors());
app.use(express.json());

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

const categories = [
  { id: 1, name: 'Electronics', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400', slug: 'electronics' },
  { id: 2, name: 'Fashion', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400', slug: 'fashion' },
  { id: 3, name: 'Home & Kitchen', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400', slug: 'home-kitchen' },
  { id: 4, name: 'Beauty', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400', slug: 'beauty' },
  { id: 5, name: 'Sports', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400', slug: 'sports' },
  { id: 6, name: 'Books', image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400', slug: 'books' },
  { id: 7, name: 'Toys', image: 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400', slug: 'toys' },
  { id: 8, name: 'Grocery', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400', slug: 'grocery' }
];

const products = [
  { id: 1, name: 'Apple iPhone 15 Pro', category: 'electronics', price: 134900, originalPrice: 149900, rating: 4.7, reviews: 2341, image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400', description: 'A17 Pro chip, 6.1-inch Super Retina XDR display, Titanium design', inStock: true, badge: 'Best Seller', variants: [
    { id: 'v1', name: '128GB - Natural Titanium', price: 134900, stock: 10 },
    { id: 'v2', name: '256GB - Natural Titanium', price: 149900, stock: 5 },
    { id: 'v3', name: '128GB - Blue Titanium', price: 134900, stock: 8 }
  ]},
  { id: 2, name: 'Samsung Galaxy S24 Ultra', category: 'electronics', price: 129999, originalPrice: 144999, rating: 4.6, reviews: 1876, image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400', description: 'Snapdragon 8 Gen 3, 200MP camera, S Pen included', inStock: true, badge: 'Trending', variants: [
    { id: 'v1', name: '12GB/256GB - Titanium Black', price: 129999, stock: 12 },
    { id: 'v2', name: '12GB/512GB - Titanium Gray', price: 144999, stock: 7 }
  ]},
  { id: 3, name: 'MacBook Air M2', category: 'electronics', price: 89990, originalPrice: 99900, rating: 4.8, reviews: 3421, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400', description: 'M2 chip, 13.6-inch Liquid Retina display, All-day battery life', inStock: true },
  { id: 4, name: 'Sony WH-1000XM5', category: 'electronics', price: 26990, originalPrice: 32990, rating: 4.7, reviews: 5621, image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400', description: 'Industry-leading noise cancellation, 30-hour battery', inStock: true, badge: 'Great Indian Festival', variants: [
    { id: 'v1', name: 'Black', price: 26990, stock: 15 },
    { id: 'v2', name: 'Silver', price: 26990, stock: 10 },
    { id: 'v3', name: 'Midnight Blue', price: 27990, stock: 8 }
  ]},
  { id: 5, name: 'Nike Air Max 270', category: 'fashion', price: 8995, originalPrice: 11995, rating: 4.5, reviews: 8921, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', description: "Men's Running Shoes, Max Air unit for all-day comfort", inStock: true, variants: [
    { id: 'v1', name: 'White/Black - US 8', price: 8995, stock: 20 },
    { id: 'v2', name: 'White/Black - US 9', price: 8995, stock: 18 },
    { id: 'v3', name: 'White/Black - US 10', price: 8995, stock: 15 },
    { id: 'v4', name: 'Red/White - US 8', price: 9495, stock: 12 }
  ]},
  { id: 6, name: 'Adidas Ultraboost 22', category: 'fashion', price: 7999, originalPrice: 10999, rating: 4.6, reviews: 4521, image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400', description: "Men's Running Shoes, Boost midsole for incredible energy return", inStock: true },
  { id: 7, name: 'Puma Regular Fit T-Shirt', category: 'fashion', price: 799, originalPrice: 1299, rating: 4.3, reviews: 2134, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', description: 'Cotton blend, Comfortable regular fit', inStock: true, variants: [
    { id: 'v1', name: 'Red - S', price: 799, stock: 25 },
    { id: 'v2', name: 'Red - M', price: 799, stock: 30 },
    { id: 'v3', name: 'Red - L', price: 799, stock: 20 },
    { id: 'v4', name: 'Blue - S', price: 799, stock: 15 },
    { id: 'v5', name: 'Blue - M', price: 799, stock: 25 }
  ]},
  { id: 8, name: "Levi's 511 Slim Fit Jeans", category: 'fashion', price: 2299, originalPrice: 3999, rating: 4.4, reviews: 7823, image: 'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=400', description: 'Slim fit, Stretch denim, Classic 5-pocket style', inStock: true, variants: [
    { id: 'v1', name: 'Dark Stonewash - 30', price: 2299, stock: 15 },
    { id: 'v2', name: 'Dark Stonewash - 32', price: 2299, stock: 20 },
    { id: 'v3', name: 'Light Blue - 30', price: 2499, stock: 12 }
  ]},
  { id: 9, name: 'Samsung 65 inch 4K Smart TV', category: 'home-kitchen', price: 54999, originalPrice: 79999, rating: 4.5, reviews: 1234, image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400', description: 'Crystal UHD, HDR, Smart Hub, Gaming Mode', inStock: true, badge: 'Limited Time Offer' },
  { id: 10, name: 'Philips Air Fryer XXL', category: 'home-kitchen', price: 12499, originalPrice: 17999, rating: 4.4, reviews: 3421, image: 'https://images.unsplash.com/photo-1589647363585-f4a7d3877b10?w=400', description: '7.3L capacity, Rapid Air technology, 90% less fat', inStock: true },
  { id: 11, name: 'IKEA Poang Armchair', category: 'home-kitchen', price: 8990, originalPrice: 12990, rating: 4.3, reviews: 892, image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400', description: 'Comfortable design, Multiple colors available', inStock: true, variants: [
    { id: 'v1', name: 'Birch Veneer - White', price: 8990, stock: 8 },
    { id: 'v2', name: 'Birch Veneer - Brown', price: 8990, stock: 6 },
    { id: 'v3', name: 'Black-Brown', price: 9490, stock: 5 }
  ]},
  { id: 12, name: 'Prestige Cooktop 4 Burner', category: 'home-kitchen', price: 4599, originalPrice: 6999, rating: 4.2, reviews: 2341, image: 'https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=400', description: 'Gas stove, Auto ignition, Stainless steel', inStock: true },
  { id: 13, name: "L'Oreal Paris Serum", category: 'beauty', price: 599, originalPrice: 899, rating: 4.4, reviews: 12341, image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400', description: 'Vitamin C serum, Brightening & anti-aging', inStock: true },
  { id: 14, name: 'Maybelline Matte Lipstick', category: 'beauty', price: 499, originalPrice: 699, rating: 4.5, reviews: 8923, image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400', description: 'Long lasting, 12 shades available', inStock: true, variants: [
    { id: 'v1', name: 'Ruby Rush - 655', price: 499, stock: 50 },
    { id: 'v2', name: 'Nude Nuance - 820', price: 499, stock: 45 },
    { id: 'v3', name: 'Berry Much - 730', price: 499, stock: 40 },
    { id: 'v4', name: 'Pink Charge - 915', price: 499, stock: 35 }
  ]},
  { id: 15, name: 'Dove Shampoo 1L', category: 'beauty', price: 399, originalPrice: 549, rating: 4.3, reviews: 15672, image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400', description: 'Anti-hair fall, Gentle care', inStock: true },
  { id: 16, name: 'Nykaa Face Serum', category: 'beauty', price: 699, originalPrice: 999, rating: 4.6, reviews: 6721, image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400', description: 'Hyaluronic acid, Hydrating', inStock: true },
  { id: 17, name: 'Yoga Mat Premium', category: 'sports', price: 899, originalPrice: 1499, rating: 4.5, reviews: 4532, image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400', description: '6mm thickness, Non-slip, Eco-friendly', inStock: true, variants: [
    { id: 'v1', name: 'Purple - 6mm', price: 899, stock: 30 },
    { id: 'v2', name: 'Blue - 6mm', price: 899, stock: 25 },
    { id: 'v3', name: 'Pink - 8mm', price: 1099, stock: 20 }
  ]},
  { id: 18, name: 'Cricket Bat Kashmir Willow', category: 'sports', price: 2199, originalPrice: 3499, rating: 4.4, reviews: 2134, image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400', description: 'Premium quality, Lightweight', inStock: true },
  { id: 19, name: 'Badminton Racket Set', category: 'sports', price: 1299, originalPrice: 2499, rating: 4.3, reviews: 3421, image: 'https://images.unsplash.com/photo-1617083934555-563a14e3665d?w=400', description: '2 rackets, Shuttlecocks, Full size court', inStock: true },
  { id: 20, name: "Gold's Gym Dumbbells 10kg", category: 'sports', price: 1599, originalPrice: 2299, rating: 4.5, reviews: 1892, image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400', description: 'Cast iron, Hex shape', inStock: true },
  { id: 21, name: 'Atomic Habits', category: 'books', price: 399, originalPrice: 599, rating: 4.8, reviews: 45621, image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400', description: 'James Clear, Transform your life', inStock: true, badge: '#1 Bestseller' },
  { id: 22, name: 'The Psychology of Money', category: 'books', price: 299, originalPrice: 499, rating: 4.7, reviews: 28341, image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400', description: 'Morgan Housel, Timeless lessons', inStock: true },
  { id: 23, name: 'Harry Potter Set (7 Books)', category: 'books', price: 2499, originalPrice: 3999, rating: 4.9, reviews: 67234, image: 'https://images.unsplash.com/photo-1618666012174-83b441c0bc76?w=400', description: 'J.K. Rowling, Complete collection', inStock: true },
  { id: 24, name: 'CBSE 12th Question Bank', category: 'books', price: 599, originalPrice: 899, rating: 4.4, reviews: 8923, image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400', description: 'Physics, Chemistry, Math, 2024-25', inStock: true },
  { id: 25, name: 'LEGO City Set', category: 'toys', price: 2499, originalPrice: 3499, rating: 4.7, reviews: 3421, image: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400', description: '603-piece, City police station', inStock: true },
  { id: 26, name: 'Barbie Dreamhouse', category: 'toys', price: 8999, originalPrice: 12999, rating: 4.6, reviews: 2134, image: 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400', description: 'Multistory house, Furniture included', inStock: true },
  { id: 27, name: 'Remote Control Car', category: 'toys', price: 1999, originalPrice: 3499, rating: 4.4, reviews: 4532, image: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=400', description: 'High speed, Rechargeable battery', inStock: true },
  { id: 28, name: 'Uno Card Game', category: 'toys', price: 199, originalPrice: 399, rating: 4.6, reviews: 23421, image: 'https://images.unsplash.com/photo-1605020420620-20c943cc4669?w=400', description: 'Classic card game, 2-10 players', inStock: true },
  { id: 29, name: 'Basmati Rice 5kg', category: 'grocery', price: 899, originalPrice: 1199, rating: 4.5, reviews: 12341, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', description: 'Premium quality, Long grain', inStock: true },
  { id: 30, name: 'Tata Tea 1kg', category: 'grocery', price: 295, originalPrice: 399, rating: 4.4, reviews: 23421, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400', description: 'Premium blend, Authentic taste', inStock: true },
  { id: 31, name: 'Maggi Noodles Pack of 12', category: 'grocery', price: 199, originalPrice: 299, rating: 4.3, reviews: 34521, image: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400', description: '2-minute noodles, Classic masala', inStock: true },
  { id: 32, name: 'Amul Butter 500g', category: 'grocery', price: 235, originalPrice: 280, rating: 4.6, reviews: 45621, image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400', description: 'Pure cow milk butter', inStock: true }
];

const users = [
  { id: 1, email: 'demo@shopindia.com', password: 'demo123', name: 'Demo User', phone: '9876543210', addresses: [] }
];

let carts = {};
let orders = [];
let orderIdCounter = 1000;

const authMiddleware = (req, res, next) => {
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

app.get('/api/categories', (req, res) => {
  res.json(categories);
});

app.get('/api/products', (req, res) => {
  let { category, search, sort, minPrice, maxPrice } = req.query;
  let filtered = [...products];

  if (category) {
    filtered = filtered.filter(p => p.category === category);
  }
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(p => p.name.toLowerCase().includes(s) || p.description.toLowerCase().includes(s));
  }
  if (minPrice) filtered = filtered.filter(p => p.price >= parseInt(minPrice));
  if (maxPrice) filtered = filtered.filter(p => p.price <= parseInt(maxPrice));

  if (sort === 'price-asc') filtered.sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') filtered.sort((a, b) => b.price - a.price);
  if (sort === 'rating') filtered.sort((a, b) => b.rating - a.rating);

  res.json(filtered);
});

app.get('/api/admin/categories', (req, res) => {
  res.json(categories);
});

app.post('/api/admin/categories', (req, res) => {
  const { name, image } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  
  const newCategory = {
    id: categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1,
    name,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    image: image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'
  };
  categories.push(newCategory);
  res.status(201).json(newCategory);
});

app.put('/api/admin/categories/:id', (req, res) => {
  const index = categories.findIndex(c => c.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Category not found' });
  
  const { name, image } = req.body;
  categories[index] = {
    ...categories[index],
    name: name || categories[index].name,
    slug: name ? name.toLowerCase().replace(/\s+/g, '-') : categories[index].slug,
    image: image || categories[index].image
  };
  res.json(categories[index]);
});

app.delete('/api/admin/categories/:id', (req, res) => {
  const index = categories.findIndex(c => c.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Category not found' });
  categories.splice(index, 1);
  res.json({ message: 'Category deleted' });
});

app.post('/api/admin/products/bulk', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  
  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    
    const addedProducts = [];
    const maxId = products.length > 0 ? Math.max(...products.map(p => p.id)) : 0;
    
    data.forEach((row, index) => {
      if (row.name && row.category && row.price) {
        const newProduct = {
          id: maxId + index + 1,
          name: row.name,
          category: row.category,
          price: parseInt(row.price) || 0,
          originalPrice: parseInt(row.originalPrice) || parseInt(row.price) || 0,
          rating: parseFloat(row.rating) || 4.0,
          reviews: parseInt(row.reviews) || 0,
          image: row.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
          description: row.description || '',
          inStock: row.inStock !== undefined ? (row.inStock === 'true' || row.inStock === true) : true,
          badge: row.badge || null,
          variants: []
        };
        
        if (row.variant1_name || row.variant1_price) {
          if (row.variant1_name && row.variant1_price) {
            newProduct.variants.push({
              id: 'v' + (Date.now() + 1),
              name: row.variant1_name,
              price: parseInt(row.variant1_price) || newProduct.price,
              stock: parseInt(row.variant1_stock) || 10,
              image: row.variant1_image || null
            });
          }
          if (row.variant2_name && row.variant2_price) {
            newProduct.variants.push({
              id: 'v' + (Date.now() + 2),
              name: row.variant2_name,
              price: parseInt(row.variant2_price) || newProduct.price,
              stock: parseInt(row.variant2_stock) || 10,
              image: row.variant2_image || null
            });
          }
          if (row.variant3_name && row.variant3_price) {
            newProduct.variants.push({
              id: 'v' + (Date.now() + 3),
              name: row.variant3_name,
              price: parseInt(row.variant3_price) || newProduct.price,
              stock: parseInt(row.variant3_stock) || 10,
              image: row.variant3_image || null
            });
          }
          if (row.variant4_name && row.variant4_price) {
            newProduct.variants.push({
              id: 'v' + (Date.now() + 4),
              name: row.variant4_name,
              price: parseInt(row.variant4_price) || newProduct.price,
              stock: parseInt(row.variant4_stock) || 10,
              image: row.variant4_image || null
            });
          }
          if (row.variant5_name && row.variant5_price) {
            newProduct.variants.push({
              id: 'v' + (Date.now() + 5),
              name: row.variant5_name,
              price: parseInt(row.variant5_price) || newProduct.price,
              stock: parseInt(row.variant5_stock) || 10,
              image: row.variant5_image || null
            });
          }
        }
        
        products.push(newProduct);
        addedProducts.push(newProduct);
      }
    });
    
    res.json({ 
      message: `Successfully added ${addedProducts.length} products`,
      count: addedProducts.length,
      products: addedProducts
    });
  } catch (err) {
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
      badge: 'New',
      variant1_name: 'Red - S', variant1_price: 999, variant1_stock: 10, variant1_image: '',
      variant2_name: 'Red - M', variant2_price: 999, variant2_stock: 15, variant2_image: '',
      variant3_name: 'Red - L', variant3_price: 999, variant3_stock: 12, variant3_image: '',
      variant4_name: 'Blue - S', variant4_price: 999, variant4_stock: 8, variant4_image: '',
      variant5_name: 'Blue - M', variant5_price: 999, variant5_stock: 10, variant5_image: ''
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
      badge: '',
      variant1_name: 'Black', variant1_price: 299, variant1_stock: 20, variant1_image: '',
      variant2_name: 'White', variant2_price: 299, variant2_stock: 15, variant2_image: '',
      variant3_name: 'Red', variant3_price: 349, variant3_stock: 10, variant3_image: '',
      variant4_name: '', variant4_price: '', variant4_stock: '', variant4_image: '',
      variant5_name: '', variant5_price: '', variant5_stock: '', variant5_image: ''
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

app.post('/api/products', (req, res) => {
  const { name, category, price, originalPrice, rating, reviews, image, description, inStock, badge } = req.body;
  
  if (!name || !category || !price) {
    return res.status(400).json({ error: 'Name, category, and price are required' });
  }

  const newProduct = {
    id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
    name,
    category,
    price: parseInt(price),
    originalPrice: parseInt(originalPrice) || parseInt(price),
    rating: parseFloat(rating) || 4.0,
    reviews: parseInt(reviews) || 0,
    image: image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
    description: description || '',
    inStock: inStock !== undefined ? inStock : true,
    badge: badge || null
  };

  products.push(newProduct);
  res.status(201).json(newProduct);
});

app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

app.post('/api/products/:id/variants', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (!product) return res.status(404).json({ error: 'Product not found' });
  
  const { name, price, stock, image } = req.body;
  if (!name || price === undefined) {
    return res.status(400).json({ error: 'Name and price are required' });
  }
  
  if (!product.variants) product.variants = [];
  
  const newVariant = {
    id: 'v' + Date.now(),
    name,
    price: parseInt(price),
    stock: parseInt(stock) || 0,
    image: image || null
  };
  
  product.variants.push(newVariant);
  res.status(201).json(newVariant);
});

app.put('/api/products/:id/variants/:variantId', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (!product) return res.status(404).json({ error: 'Product not found' });
  
  if (!product.variants) product.variants = [];
  const variantIndex = product.variants.findIndex(v => v.id === req.params.variantId);
  if (variantIndex === -1) return res.status(404).json({ error: 'Variant not found' });
  
  const { name, price, stock, image } = req.body;
  
  product.variants[variantIndex] = {
    ...product.variants[variantIndex],
    name: name || product.variants[variantIndex].name,
    price: price !== undefined ? parseInt(price) : product.variants[variantIndex].price,
    stock: stock !== undefined ? parseInt(stock) : product.variants[variantIndex].stock,
    image: image !== undefined ? image : product.variants[variantIndex].image
  };
  
  res.json(product.variants[variantIndex]);
});

app.delete('/api/products/:id/variants/:variantId', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (!product) return res.status(404).json({ error: 'Product not found' });
  
  if (!product.variants) product.variants = [];
  const variantIndex = product.variants.findIndex(v => v.id === req.params.variantId);
  if (variantIndex === -1) return res.status(404).json({ error: 'Variant not found' });
  
  product.variants.splice(variantIndex, 1);
  res.json({ message: 'Variant deleted' });
});

app.post('/api/auth/register', (req, res) => {
  const { email, password, name, phone } = req.body;
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'Email already exists' });
  }
  const newUser = { id: users.length + 1, email, password, name, phone, addresses: [] };
  users.push(newUser);
  const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: newUser.id, email: newUser.email, name: newUser.name } });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

app.get('/api/auth/profile', authMiddleware, (req, res) => {
  const user = users.find(u => u.id === req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ id: user.id, email: user.email, name: user.name, phone: user.phone, addresses: user.addresses });
});

app.get('/api/cart', authMiddleware, (req, res) => {
  const cart = carts[req.userId] || [];
  res.json(cart);
});

app.post('/api/cart/add', authMiddleware, (req, res) => {
  const { productId, quantity = 1, variantId } = req.body;
  const product = products.find(p => p.id === productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  let variant = null;
  if (variantId && product.variants) {
    variant = product.variants.find(v => v.id === variantId);
  }

  if (!carts[req.userId]) carts[req.userId] = [];
  
  const existing = carts[req.userId].find(item => item.productId === productId && item.variantId === variantId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    carts[req.userId].push({ productId, quantity, variantId, variant, product });
  }
  res.json(carts[req.userId]);
});

app.put('/api/cart/update', authMiddleware, (req, res) => {
  const { productId, quantity, variantId } = req.body;
  if (!carts[req.userId]) return res.json([]);
  const item = carts[req.userId].find(i => i.productId === productId && i.variantId === variantId);
  if (item) item.quantity = quantity;
  res.json(carts[req.userId]);
});

app.delete('/api/cart/remove/:productId/:variantId?', authMiddleware, (req, res) => {
  if (!carts[req.userId]) return res.json([]);
  const variantId = req.params.variantId;
  if (variantId) {
    carts[req.userId] = carts[req.userId].filter(i => !(i.productId === parseInt(req.params.productId) && i.variantId === variantId));
  } else {
    carts[req.userId] = carts[req.userId].filter(i => i.productId !== parseInt(req.params.productId));
  }
  res.json(carts[req.userId]);
});

app.post('/api/orders', authMiddleware, (req, res) => {
  const { items, address, paymentId } = req.body;
  const user = users.find(u => u.id === req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const totalAmount = items.reduce((sum, item) => {
    const price = item.variant?.price || item.product.price;
    return sum + (price * item.quantity);
  }, 0);
  const order = {
    id: ++orderIdCounter,
    userId: req.userId,
    items,
    address,
    paymentId: paymentId || 'DEMO_' + Date.now(),
    totalAmount,
    status: 'Confirmed',
    createdAt: new Date().toISOString()
  };
  orders.push(order);
  carts[req.userId] = [];
  res.json(order);
});

app.get('/api/orders', authMiddleware, (req, res) => {
  const userOrders = orders.filter(o => o.userId === req.userId);
  res.json(userOrders);
});

app.get('/api/orders/:id', authMiddleware, (req, res) => {
  const order = orders.find(o => o.id === parseInt(req.params.id) && o.userId === req.userId);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
