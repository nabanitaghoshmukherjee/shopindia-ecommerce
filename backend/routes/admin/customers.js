const express = require('express');
const router = express.Router();
const { adminAuth, requirePermission, pool } = require('../../middleware/adminAuth');

router.get('/', adminAuth, requirePermission('customers'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, sort = 'created_at', order = 'DESC' } = req.query;
    const offset = (page - 1) * limit;
    let query = `SELECT u.id, u.email, u.name, u.phone, u.is_active, u.created_at,
                 (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) as order_count,
                 (SELECT COALESCE(SUM(total_amount),0) FROM orders o WHERE o.user_id = u.id AND o.status != 'Cancelled') as total_spent
                 FROM users u WHERE u.is_admin = FALSE`;
    let params = [];
    let pc = 0;
    if (search) { pc++; query += ` AND (LOWER(u.name) LIKE $${pc} OR LOWER(u.email) LIKE $${pc})`; params.push(`%${search.toLowerCase()}%`); }
    const sorts = { created_at: 'u.created_at', name: 'u.name', order_count: 'order_count', total_spent: 'total_spent' };
    query += ` ORDER BY ${sorts[sort] || 'u.created_at'} ${order === 'ASC' ? 'ASC' : 'DESC'}`;
    pc++; query += ` LIMIT $${pc}`; params.push(limit);
    pc++; query += ` OFFSET $${pc}`; params.push(offset);
    const result = await pool.query(query, params);
    const count = await pool.query('SELECT COUNT(*) FROM users WHERE is_admin = FALSE');
    res.json({ data: result.rows, total: parseInt(count.rows[0].count), page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Database error' }); }
});

router.get('/:id', adminAuth, requirePermission('customers'), async (req, res) => {
  try {
    const user = await pool.query('SELECT id, email, name, phone, is_active, created_at FROM users WHERE id = $1', [req.params.id]);
    if (!user.rows.length) return res.status(404).json({ error: 'Customer not found' });
    const addresses = await pool.query('SELECT * FROM addresses WHERE user_id = $1', [req.params.id]);
    const orders = await pool.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20', [req.params.id]);
    res.json({ ...user.rows[0], addresses: addresses.rows, orders: orders.rows });
  } catch (err) { res.status(500).json({ error: 'Database error' }); }
});

router.put('/:id/status', adminAuth, requirePermission('customers'), async (req, res) => {
  try {
    const { is_active } = req.body;
    await pool.query('UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [is_active, req.params.id]);
    res.json({ message: 'Customer status updated' });
  } catch (err) { res.status(500).json({ error: 'Database error' }); }
});

module.exports = router;

