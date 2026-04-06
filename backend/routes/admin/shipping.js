const express = require('express');
const router = express.Router();
const { adminAuth, requirePermission, logAction, pool } = require('../../middleware/adminAuth');

router.get('/', adminAuth, requirePermission('shipping'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;
    let query = "SELECT s.*, o.total_amount, o.status as order_status, u.name as customer_name, u.email as customer_email, o.shipping_address FROM shipments s JOIN orders o ON s.order_id = o.id LEFT JOIN users u ON o.user_id = u.id";
    let params = [];
    let pc = 0;
    if (status) { pc++; query += " WHERE s.status = $" + pc; params.push(status); }
    query += " ORDER BY s.created_at DESC";
    pc++; query += " LIMIT $" + pc; params.push(limit);
    pc++; query += " OFFSET $" + pc; params.push(offset);
    const result = await pool.query(query, params);
    const count = await pool.query("SELECT COUNT(*) FROM shipments");
    res.json({ data: result.rows, total: parseInt(count.rows[0].count) });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Database error' }); }
});

router.post('/', adminAuth, requirePermission('shipping'), async (req, res) => {
  try {
    const { order_id, courier_name, tracking_number, status } = req.body;
    const existing = await pool.query("SELECT id FROM shipments WHERE order_id = $1", [order_id]);
    let result;
    if (existing.rows.length) {
      result = await pool.query(
        "UPDATE shipments SET courier_name=$1, tracking_number=$2, status=$3, updated_at=CURRENT_TIMESTAMP WHERE order_id=$4 RETURNING *",
        [courier_name, tracking_number, status || 'shipped', order_id]);
    } else {
      result = await pool.query(
        "INSERT INTO shipments (order_id, courier_name, tracking_number, status, shipped_at) VALUES ($1,$2,$3,$4,CURRENT_TIMESTAMP) RETURNING *",
        [order_id, courier_name, tracking_number, status || 'shipped']);
    }
    await pool.query("UPDATE orders SET tracking_number=$1, courier_name=$2, status=$3, updated_at=CURRENT_TIMESTAMP WHERE id=$4",
      [tracking_number, courier_name, status === 'delivered' ? 'Delivered' : 'Shipped', order_id]);
    await logAction(req.userId, 'update_shipment', 'shipment', result.rows[0].id, null, req.body, req.ip);
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Database error' }); }
});

router.put('/:id/status', adminAuth, requirePermission('shipping'), async (req, res) => {
  try {
    const { status } = req.body;
    const deliveredAt = status === 'delivered' ? ', delivered_at=CURRENT_TIMESTAMP' : '';
    const result = await pool.query(
      "UPDATE shipments SET status=$1" + deliveredAt + ", updated_at=CURRENT_TIMESTAMP WHERE id=$2 RETURNING *",
      [status, req.params.id]);
    if (result.rows.length && status === 'delivered') {
      await pool.query("UPDATE orders SET status='Delivered', updated_at=CURRENT_TIMESTAMP WHERE id=$1", [result.rows[0].order_id]);
    }
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Database error' }); }
});

module.exports = router;

