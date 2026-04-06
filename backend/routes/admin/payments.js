const express = require('express');
const router = express.Router();
const { adminAuth, requirePermission, logAction, pool } = require('../../middleware/adminAuth');

router.get('/', adminAuth, requirePermission('payments'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status, date_from, date_to } = req.query;
    const offset = (page - 1) * limit;
    let query = `SELECT o.id as order_id, o.total_amount, o.status, o.payment_id, o.created_at, u.name as customer_name, u.email as customer_email
                 FROM orders o LEFT JOIN users u ON o.user_id = u.id`;
    let conditions = [];
    let params = [];
    let pc = 0;
    if (status === 'paid') conditions.push("o.payment_id IS NOT NULL AND o.status != 'Cancelled'");
    else if (status === 'failed') conditions.push("o.payment_id IS NULL");
    else if (status === 'refunded') conditions.push("o.status = 'Refunded'");
    if (date_from) { pc++; conditions.push(`o.created_at >= $${pc}`); params.push(date_from); }
    if (date_to) { pc++; conditions.push(`o.created_at <= $${pc}`); params.push(date_to); }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY o.created_at DESC';
    pc++; query += ` LIMIT $${pc}`; params.push(limit);
    pc++; query += ` OFFSET $${pc}`; params.push(offset);
    const result = await pool.query(query, params);
    const count = await pool.query('SELECT COUNT(*) FROM orders');
    res.json({ data: result.rows, total: parseInt(count.rows[0].count) });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Database error' }); }
});

// Process refund
router.post('/refund/:orderId', adminAuth, requirePermission('payments'), async (req, res) => {
  try {
    const { amount, reason } = req.body;
    const order = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.orderId]);
    if (!order.rows.length) return res.status(404).json({ error: 'Order not found' });
    
    const refundAmount = amount || order.rows[0].total_amount;
    const isFull = refundAmount >= order.rows[0].total_amount;
    
    await pool.query(
      `UPDATE orders SET status = $1, notes = COALESCE(notes || ' | ', '') || $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
      [isFull ? 'Refunded' : order.rows[0].status, `Refund: ₹${refundAmount} - ${reason || 'Admin refund'}`, req.params.orderId]
    );
    await logAction(req.userId, 'process_refund', 'order', req.params.orderId, null, { amount: refundAmount, reason, full: isFull }, req.ip);
    res.json({ message: `Refund of ₹${refundAmount} processed` });
  } catch (err) { res.status(500).json({ error: 'Database error' }); }
});

module.exports = router;
