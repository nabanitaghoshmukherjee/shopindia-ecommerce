const express = require('express');
const router = express.Router();
const { adminAuth, requirePermission, logAction, pool } = require('../../middleware/adminAuth');

router.get('/', adminAuth, requirePermission('reviews'), async (req, res) => {
  try {
    const { page = 1, limit = 20, is_approved, rating, product_id } = req.query;
    const offset = (page - 1) * limit;
    let query = `SELECT r.*, u.name as user_name, u.email as user_email, p.name as product_name, p.image as product_image
                 FROM reviews r LEFT JOIN users u ON r.user_id = u.id LEFT JOIN products p ON r.product_id = p.id`;
    let conditions = [];
    let params = [];
    let pc = 0;
    if (is_approved !== undefined) { pc++; conditions.push(`r.is_approved = $${pc}`); params.push(is_approved === 'true'); }
    if (rating) { pc++; conditions.push(`r.rating = $${pc}`); params.push(parseInt(rating)); }
    if (product_id) { pc++; conditions.push(`r.product_id = $${pc}`); params.push(product_id); }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY r.created_at DESC';
    pc++; query += ` LIMIT $${pc}`; params.push(limit);
    pc++; query += ` OFFSET $${pc}`; params.push(offset);
    const result = await pool.query(query, params);
    const count = await pool.query('SELECT COUNT(*) FROM reviews');
    res.json({ data: result.rows, total: parseInt(count.rows[0].count) });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Database error' }); }
});

router.put('/:id/approve', adminAuth, requirePermission('reviews'), async (req, res) => {
  try {
    const result = await pool.query('UPDATE reviews SET is_approved = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Review not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Database error' }); }
});

router.put('/:id/reject', adminAuth, requirePermission('reviews'), async (req, res) => {
  try {
    const result = await pool.query('UPDATE reviews SET is_approved = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Review not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Database error' }); }
});

router.delete('/:id', adminAuth, requirePermission('reviews'), async (req, res) => {
  try {
    await pool.query('DELETE FROM reviews WHERE id = $1', [req.params.id]);
    res.json({ message: 'Review deleted' });
  } catch (err) { res.status(500).json({ error: 'Database error' }); }
});

module.exports = router;
