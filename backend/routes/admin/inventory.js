const express = require('express');
const router = express.Router();
const { adminAuth, requirePermission, logAction, pool } = require('../../middleware/adminAuth');

router.get('/', adminAuth, requirePermission('inventory'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, warehouse_id, low_stock } = req.query;
    const offset = (page - 1) * limit;
    let query = `SELECT p.id as product_id, p.name, p.sku, p.image, p.category, p.stock_quantity, p.low_stock_threshold,
                 COALESCE(json_agg(json_build_object('variant_id', pv.id, 'variant_name', pv.name, 'stock', pv.stock, 'price', pv.price)) FILTER (WHERE pv.id IS NOT NULL), '\[\]') as variants
                 FROM products p LEFT JOIN product_variants pv ON p.id = pv.product_id`;
    let conditions = [];
    let params = [];
    let pc = 0;
    if (search) { pc++; conditions.push(`(LOWER(p.name) LIKE $${pc} OR LOWER(p.sku) LIKE $${pc})`); params.push(`%${search.toLowerCase()}%`); }
    if (low_stock === 'true') conditions.push('p.stock_quantity <= COALESCE(p.low_stock_threshold, 10)');
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' GROUP BY p.id ORDER BY p.stock_quantity ASC';
    pc++; query += ` LIMIT $${pc}`; params.push(limit);
    pc++; query += ` OFFSET $${pc}`; params.push(offset);
    const result = await pool.query(query, params);
    const count = await pool.query('SELECT COUNT(*) FROM products');
    res.json({ data: result.rows, total: parseInt(count.rows[0].count), page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Database error' }); }
});

// Update stock
router.put('/stock/:productId', adminAuth, requirePermission('inventory'), async (req, res) => {
  try {
    const { stock_quantity, variant_id, quantity } = req.body;
    if (variant_id) {
      const old = await pool.query('SELECT stock FROM product_variants WHERE id = $1', [variant_id]);
      const newStock = quantity !== undefined ? (old.rows[0]?.stock || 0) + quantity : stock_quantity;
      await pool.query('UPDATE product_variants SET stock = $1 WHERE id = $2', [newStock, variant_id]);
    } else {
      const old = await pool.query('SELECT stock_quantity FROM products WHERE id = $1', [req.params.productId]);
      const newStock = quantity !== undefined ? (old.rows[0]?.stock_quantity || 0) + quantity : stock_quantity;
      await pool.query('UPDATE products SET stock_quantity = $1, in_stock = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3', [newStock, newStock > 0, req.params.productId]);
    }
    await logAction(req.userId, 'update_stock', 'product', req.params.productId, null, { stock_quantity, variant_id, quantity }, req.ip);
    res.json({ message: 'Stock updated' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Database error' }); }
});

// Warehouses
router.get('/warehouses', adminAuth, requirePermission('inventory'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM warehouses ORDER BY id');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: 'Database error' }); }
});

router.post('/warehouses', adminAuth, requirePermission('inventory'), async (req, res) => {
  try {
    const { name, address, city, state, postal_code } = req.body;
    const result = await pool.query('INSERT INTO warehouses (name, address, city, state, postal_code) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [name, address, city, state, postal_code]);
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Database error' }); }
});

router.put('/warehouses/:id', adminAuth, requirePermission('inventory'), async (req, res) => {
  try {
    const { name, address, city, state, postal_code, is_active } = req.body;
    const result = await pool.query(
      'UPDATE warehouses SET name=COALESCE($1,name), address=COALESCE($2,address), city=COALESCE($3,city), state=COALESCE($4,state), postal_code=COALESCE($5,postal_code), is_active=COALESCE($6,is_active) WHERE id=$7 RETURNING *',
      [name, address, city, state, postal_code, is_active, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Database error' }); }
});

module.exports = router;


