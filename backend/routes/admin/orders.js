const express = require('express');
const router = express.Router();
const { adminAuth, requirePermission, logAction, pool } = require('../../middleware/adminAuth');

// List all orders with filters
router.get('/', adminAuth, requirePermission('orders'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search, sort = 'created_at', order = 'DESC', date_from, date_to } = req.query;
    const offset = (page - 1) * limit;
    let query = `SELECT o.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone
                 FROM orders o LEFT JOIN users u ON o.user_id = u.id`;
    let conditions = [];
    let params = [];
    let pc = 0;

    if (status) { pc++; conditions.push(`o.status = $${pc}`); params.push(status); }
    if (search) { pc++; conditions.push(`(u.name ILIKE $${pc} OR u.email ILIKE $${pc} OR o.id::text = $${pc})`); params.push(`%${search}%`); }
    if (date_from) { pc++; conditions.push(`o.created_at >= $${pc}`); params.push(date_from); }
    if (date_to) { pc++; conditions.push(`o.created_at <= $${pc}`); params.push(date_to); }

    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    const allowedSorts = ['id', 'total_amount', 'status', 'created_at'];
    query += ` ORDER BY o.${allowedSorts.includes(sort) ? sort : 'created_at'} ${order === 'ASC' ? 'ASC' : 'DESC'}`;
    pc++; query += ` LIMIT $${pc}`; params.push(limit);
    pc++; query += ` OFFSET $${pc}`; params.push(offset);

    const result = await pool.query(query, params);
    const countQ = await pool.query(`SELECT COUNT(*) FROM orders o LEFT JOIN users u ON o.user_id = u.id ${conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''}`, params.slice(0, -2));
    res.json({ data: result.rows, total: parseInt(countQ.rows[0].count), page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get order details
router.get('/:id', adminAuth, requirePermission('orders'), async (req, res) => {
  try {
    const order = await pool.query(
      `SELECT o.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone
       FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.id = $1`, [req.params.id]
    );
    if (!order.rows.length) return res.status(404).json({ error: 'Order not found' });
    const items = await pool.query(
      `SELECT oi.*, p.name as product_name, p.image as product_image, pv.name as variant_name
       FROM order_items oi JOIN products p ON oi.product_id = p.id LEFT JOIN product_variants pv ON oi.variant_id = pv.id
       WHERE oi.order_id = $1`, [req.params.id]
    );
    const shipment = await pool.query('SELECT * FROM shipments WHERE order_id = $1', [req.params.id]);
    res.json({ ...order.rows[0], items: items.rows, shipment: shipment.rows[0] || null });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Update order status
router.put('/:id/status', adminAuth, requirePermission('orders'), async (req, res) => {
  try {
    const { status, notes, tracking_number, courier_name } = req.body;
    const validStatuses = ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const old = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    if (!old.rows.length) return res.status(404).json({ error: 'Order not found' });

    const result = await pool.query(
      `UPDATE orders SET status=$1, notes=COALESCE($2,notes), tracking_number=COALESCE($3,tracking_number), 
       courier_name=COALESCE($4,courier_name), updated_at=CURRENT_TIMESTAMP WHERE id=$5 RETURNING *`,
      [status, notes, tracking_number, courier_name, req.params.id]
    );
    await logAction(req.userId, 'update_order_status', 'order', req.params.id, { status: old.rows[0].status }, { status }, req.ip);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Bulk status update
router.put('/bulk/status', adminAuth, requirePermission('orders'), async (req, res) => {
  try {
    const { order_ids, status } = req.body;
    if (!order_ids?.length || !status) return res.status(400).json({ error: 'Order IDs and status required' });
    await pool.query(`UPDATE orders SET status=$1, updated_at=CURRENT_TIMESTAMP WHERE id = ANY($2)`, [status, order_ids]);
    await logAction(req.userId, 'bulk_update_orders', 'order', null, null, { order_ids, status }, req.ip);
    res.json({ message: `${order_ids.length} orders updated` });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Generate invoice data
router.get('/:id/invoice', adminAuth, requirePermission('orders'), async (req, res) => {
  try {
    const order = await pool.query(
      `SELECT o.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone
       FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.id = $1`, [req.params.id]
    );
    if (!order.rows.length) return res.status(404).json({ error: 'Order not found' });
    const items = await pool.query(
      `SELECT oi.*, p.name as product_name, p.sku, pv.name as variant_name
       FROM order_items oi JOIN products p ON oi.product_id = p.id LEFT JOIN product_variants pv ON oi.variant_id = pv.id
       WHERE oi.order_id = $1`, [req.params.id]
    );
    const settings = await pool.query("SELECT * FROM settings WHERE key IN ('site_name','tax_rate','tax_enabled','currency_symbol')");
    const s = {};
    settings.rows.forEach(r => s[r.key] = r.value);
    
    const subtotal = items.rows.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    const taxRate = parseFloat(s.tax_rate || 0);
    const taxAmount = s.tax_enabled === 'true' ? Math.round(subtotal * taxRate / 100) : 0;
    
    res.json({
      invoice_number: `INV-${order.rows[0].id.toString().padStart(6, '0')}`,
      order: order.rows[0],
      items: items.rows,
      subtotal,
      tax_amount: taxAmount,
      discount_amount: order.rows[0].discount_amount || 0,
      shipping_amount: order.rows[0].shipping_amount || 0,
      total: order.rows[0].total_amount,
      settings: s
    });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;

