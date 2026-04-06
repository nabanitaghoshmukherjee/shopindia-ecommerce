const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const { adminAuth, requirePermission, logAction, pool } = require('../../middleware/adminAuth');
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', adminAuth, requirePermission('products'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category, sort = 'id', order = 'DESC', stock_filter } = req.query;
    const offset = (page - 1) * limit;
    let query = "SELECT p.*, COALESCE(json_agg(pv.*) FILTER (WHERE pv.id IS NOT NULL), '[]') as variants FROM products p LEFT JOIN product_variants pv ON p.id = pv.product_id";
    let conditions = [];
    let params = [];
    let pc = 0;

    if (search) { pc++; conditions.push("(LOWER(p.name) LIKE $" + pc + " OR LOWER(p.sku) LIKE $" + pc + ")"); params.push('%' + search.toLowerCase() + '%'); }
    if (category) { pc++; conditions.push("p.category = $" + pc); params.push(category); }
    if (stock_filter === 'low') conditions.push('p.stock_quantity <= COALESCE(p.low_stock_threshold, 10)');
    else if (stock_filter === 'out') conditions.push('(p.in_stock = FALSE OR p.stock_quantity = 0)');

    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' GROUP BY p.id';
    
    const allowedSorts = ['id', 'name', 'price', 'stock_quantity', 'created_at', 'rating'];
    const sortCol = allowedSorts.includes(sort) ? sort : 'id';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    query += ' ORDER BY p.' + sortCol + ' ' + sortOrder;
    
    pc++; query += ' LIMIT $' + pc; params.push(parseInt(limit));
    pc++; query += ' OFFSET $' + pc; params.push(parseInt(offset));

    const result = await pool.query(query, params);
    const countResult = await pool.query('SELECT COUNT(*) FROM products');
    res.json({ data: result.rows, total: parseInt(countResult.rows[0].count), page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error('Products error:', err.message);
    res.status(500).json({ error: 'Database error' });
  }
});

router.get('/:id', adminAuth, requirePermission('products'), async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT p.*, COALESCE(json_agg(pv.*) FILTER (WHERE pv.id IS NOT NULL), '[]') as variants FROM products p LEFT JOIN product_variants pv ON p.id = pv.product_id WHERE p.id = $1 GROUP BY p.id",
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Database error' }); }
});

router.post('/', adminAuth, requirePermission('products'), async (req, res) => {
  try {
    const { name, category, price, original_price, description, image, badge, brand, weight, dimensions, stock_quantity, low_stock_threshold, images } = req.body;
    if (!name || !category || !price) return res.status(400).json({ error: 'Name, category, and price required' });
    const sku = 'SKU-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
    const result = await pool.query(
      "INSERT INTO products (name, category, price, original_price, description, image, badge, sku, brand, weight, dimensions, stock_quantity, low_stock_threshold, images, in_stock) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,TRUE) RETURNING *",
      [name, category, parseInt(price), parseInt(original_price||price), description||'', image||'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400', badge||null, sku, brand||null, weight||null, dimensions||null, parseInt(stock_quantity||0), parseInt(low_stock_threshold||10), JSON.stringify(images||[])]
    );
    await logAction(req.userId, 'create_product', 'product', result.rows[0].id, null, result.rows[0], req.ip);
    res.status(201).json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Database error' }); }
});

router.put('/:id', adminAuth, requirePermission('products'), async (req, res) => {
  try {
    const old = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (!old.rows.length) return res.status(404).json({ error: 'Product not found' });
    const { name, category, price, original_price, description, image, badge, brand, weight, dimensions, stock_quantity, low_stock_threshold, is_active, images } = req.body;
    const result = await pool.query(
      "UPDATE products SET name=COALESCE($1,name), category=COALESCE($2,category), price=COALESCE($3,price), original_price=COALESCE($4,original_price), description=COALESCE($5,description), image=COALESCE($6,image), badge=$7, brand=COALESCE($8,brand), weight=COALESCE($9,weight), dimensions=COALESCE($10,dimensions), stock_quantity=COALESCE($11,stock_quantity), low_stock_threshold=COALESCE($12,low_stock_threshold), is_active=COALESCE($13,is_active), images=COALESCE($14,images), in_stock=COALESCE($15,in_stock), updated_at=CURRENT_TIMESTAMP WHERE id=$16 RETURNING *",
      [name, category, price, original_price, description, image, badge, brand, weight, dimensions, stock_quantity, low_stock_threshold, is_active, images ? JSON.stringify(images) : null, stock_quantity !== undefined ? (parseInt(stock_quantity) > 0) : null, req.params.id]
    );
    await logAction(req.userId, 'update_product', 'product', req.params.id, old.rows[0], result.rows[0], req.ip);
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Database error' }); }
});

router.delete('/:id', adminAuth, requirePermission('products'), async (req, res) => {
  try {
    const old = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (!old.rows.length) return res.status(404).json({ error: 'Product not found' });
    await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    await logAction(req.userId, 'delete_product', 'product', req.params.id, old.rows[0], null, req.ip);
    res.json({ message: 'Product deleted' });
  } catch (err) { res.status(500).json({ error: 'Database error' }); }
});

router.post('/bulk-upload', adminAuth, requirePermission('products'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    const wb = xlsx.read(req.file.buffer, { type: 'buffer' });
    const data = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    let count = 0;
    for (const row of data) {
      if (row.name && row.category && row.price) {
        const sku = 'SKU-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
        await pool.query(
          "INSERT INTO products (name, category, price, original_price, rating, reviews, image, description, in_stock, badge, sku, stock_quantity) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)",
          [row.name, row.category, parseInt(row.price), parseInt(row.originalPrice||row.price), parseFloat(row.rating||4), parseInt(row.reviews||0), row.image||'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400', row.description||'', row.inStock!==false, row.badge||null, sku, parseInt(row.stock||0)]
        );
        count++;
      }
    }
    await logAction(req.userId, 'bulk_upload_products', 'product', null, null, { count }, req.ip);
    res.json({ message: count + ' products added', count });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Upload failed' }); }
});

module.exports = router;

