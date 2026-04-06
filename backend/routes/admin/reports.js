const express = require('express');
const router = express.Router();
const { adminAuth, requirePermission, pool } = require('../../middleware/adminAuth');

// Sales report
router.get('/sales', adminAuth, requirePermission('reports'), async (req, res) => {
  try {
    const { date_from, date_to, group_by = 'day' } = req.query;
    const dateFormat = group_by === 'month' ? 'YYYY-MM' : group_by === 'week' ? 'IYYY-IW' : 'YYYY-MM-DD';
    let query = `SELECT TO_CHAR(o.created_at, '${dateFormat}') as period,
                 COUNT(*) as orders, COALESCE(SUM(o.total_amount),0) as revenue,
                 COALESCE(AVG(o.total_amount),0) as avg_order_value
                 FROM orders o WHERE o.status != 'Cancelled'`;
    let params = [];
    let pc = 0;
    if (date_from) { pc++; query += ` AND o.created_at >= $${pc}`; params.push(date_from); }
    if (date_to) { pc++; query += ` AND o.created_at <= $${pc}`; params.push(date_to); }
    query += ` GROUP BY period ORDER BY period ASC`;
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Database error' }); }
});

// Product performance
router.get('/products', adminAuth, requirePermission('reports'), async (req, res) => {
  try {
    const { date_from, date_to, limit = 20 } = req.query;
    let query = `SELECT p.id, p.name, p.category, p.price, p.image,
                 COALESCE(SUM(oi.quantity),0) as total_sold,
                 COALESCE(SUM(oi.quantity * oi.price),0) as total_revenue,
                 COUNT(DISTINCT o.id) as order_count
                 FROM products p
                 LEFT JOIN order_items oi ON p.id = oi.product_id
                 LEFT JOIN orders o ON oi.order_id = o.id AND o.status != 'Cancelled'`;
    let params = [];
    let pc = 0;
    if (date_from) { pc++; query += ` AND o.created_at >= $${pc}`; params.push(date_from); }
    if (date_to) { pc++; query += ` AND o.created_at <= $${pc}`; params.push(date_to); }
    query += ` GROUP BY p.id ORDER BY total_revenue DESC LIMIT $${++pc}`; params.push(limit);
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Database error' }); }
});

// Category performance
router.get('/categories', adminAuth, requirePermission('reports'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.category, COUNT(DISTINCT p.id) as product_count,
       COALESCE(SUM(oi.quantity),0) as total_sold, COALESCE(SUM(oi.quantity * oi.price),0) as total_revenue
       FROM products p LEFT JOIN order_items oi ON p.id = oi.product_id
       LEFT JOIN orders o ON oi.order_id = o.id AND o.status != 'Cancelled'
       GROUP BY p.category ORDER BY total_revenue DESC`
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: 'Database error' }); }
});

// Export sales CSV
router.get('/sales/export', adminAuth, requirePermission('reports'), async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    let query = `SELECT o.id, u.name as customer, u.email, o.total_amount, o.status, o.payment_id, o.created_at
                 FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE 1=1`;
    let params = [];
    let pc = 0;
    if (date_from) { pc++; query += ` AND o.created_at >= $${pc}`; params.push(date_from); }
    if (date_to) { pc++; query += ` AND o.created_at <= $${pc}`; params.push(date_to); }
    query += ' ORDER BY o.created_at DESC';
    const result = await pool.query(query, params);
    
    const csv = ['Order ID,Customer,Email,Amount,Status,Payment ID,Date'];
    result.rows.forEach(r => {
      csv.push(`${r.id},"${r.customer||''}","${r.email||''}",${r.total_amount},${r.status},"${r.payment_id||''}","${r.created_at}"`);
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=sales_report.csv');
    res.send(csv.join('\n'));
  } catch (err) { res.status(500).json({ error: 'Database error' }); }
});

module.exports = router;
