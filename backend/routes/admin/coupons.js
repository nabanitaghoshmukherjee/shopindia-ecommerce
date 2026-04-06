const express = require('express');
const router = express.Router();
const { adminAuth, requirePermission, logAction, pool } = require('../../middleware/adminAuth');

router.get('/', adminAuth, requirePermission('coupons'), async (req, res) => {
  try {
    const { page = 1, limit = 20, is_active } = req.query;
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM coupons';
    let params = [];
    let pc = 0;
    if (is_active !== undefined) { pc++; query += ` WHERE is_active = $${pc}`; params.push(is_active === 'true'); }
    query += ' ORDER BY created_at DESC';
    pc++; query += ` LIMIT $${pc}`; params.push(limit);
    pc++; query += ` OFFSET $${pc}`; params.push(offset);
    const result = await pool.query(query, params);
    const count = await pool.query('SELECT COUNT(*) FROM coupons');
    res.json({ data: result.rows, total: parseInt(count.rows[0].count) });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Database error' }); }
});

router.post('/', adminAuth, requirePermission('coupons'), async (req, res) => {
  try {
    const { code, type, value, min_order_value, max_discount, usage_limit, start_date, end_date, is_active } = req.body;
    if (!code || !type || !value) return res.status(400).json({ error: 'Code, type, and value required' });
    const result = await pool.query(
      `INSERT INTO coupons (code, type, value, min_order_value, max_discount, usage_limit, start_date, end_date, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [code.toUpperCase(), type, parseInt(value), parseInt(min_order_value||0), max_discount||null, usage_limit||null, start_date||null, end_date||null, is_active !== false]);
    await logAction(req.userId, 'create_coupon', 'coupon', result.rows[0].id, null, result.rows[0], req.ip);
    res.status(201).json(result.rows[0]);
  } catch (err) { console.error(err); if (err.code === '23505') return res.status(400).json({ error: 'Coupon code already exists' }); res.status(500).json({ error: 'Database error' }); }
});

router.put('/:id', adminAuth, requirePermission('coupons'), async (req, res) => {
  try {
    const old = await pool.query('SELECT * FROM coupons WHERE id = $1', [req.params.id]);
    if (!old.rows.length) return res.status(404).json({ error: 'Coupon not found' });
    const { code, type, value, min_order_value, max_discount, usage_limit, start_date, end_date, is_active } = req.body;
    const result = await pool.query(
      `UPDATE coupons SET code=COALESCE($1,code), type=COALESCE($2,type), value=COALESCE($3,value),
       min_order_value=COALESCE($4,min_order_value), max_discount=$5, usage_limit=$6,
       start_date=COALESCE($7,start_date), end_date=COALESCE($8,end_date), is_active=COALESCE($9,is_active),
       updated_at=CURRENT_TIMESTAMP WHERE id=$10 RETURNING *`,
      [code?.toUpperCase(), type, value, min_order_value, max_discount, usage_limit, start_date, end_date, is_active, req.params.id]);
    await logAction(req.userId, 'update_coupon', 'coupon', req.params.id, old.rows[0], result.rows[0], req.ip);
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Database error' }); }
});

router.delete('/:id', adminAuth, requirePermission('coupons'), async (req, res) => {
  try {
    await pool.query('DELETE FROM coupons WHERE id = $1', [req.params.id]);
    await logAction(req.userId, 'delete_coupon', 'coupon', req.params.id, null, null, req.ip);
    res.json({ message: 'Coupon deleted' });
  } catch (err) { res.status(500).json({ error: 'Database error' }); }
});

module.exports = router;
