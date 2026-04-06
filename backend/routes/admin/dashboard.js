const express = require('express');
const router = express.Router();
const { adminAuth, pool } = require('../../middleware/adminAuth');

router.get('/stats', adminAuth, async (req, res) => {
  try {
    const [orders, revenue, customers, products, pendingOrders, lowStock] = await Promise.all([
      pool.query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status='Pending') as pending, COUNT(*) FILTER (WHERE status='Confirmed') as confirmed, COUNT(*) FILTER (WHERE status='Shipped') as shipped, COUNT(*) FILTER (WHERE status='Delivered') as delivered, COUNT(*) FILTER (WHERE status='Cancelled') as cancelled FROM orders"),
      pool.query("SELECT COALESCE(SUM(total_amount),0) as total_revenue, COALESCE(SUM(total_amount) FILTER (WHERE created_at >= CURRENT_DATE),0) as today_revenue, COALESCE(SUM(total_amount) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'),0) as week_revenue, COALESCE(SUM(total_amount) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'),0) as month_revenue FROM orders WHERE status != 'Cancelled'"),
      pool.query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_this_month FROM users WHERE is_admin = FALSE"),
      pool.query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE in_stock = FALSE) as out_of_stock FROM products WHERE COALESCE(is_active, TRUE) = TRUE"),
      pool.query("SELECT id, user_id, total_amount, status, created_at FROM orders WHERE status = 'Pending' ORDER BY created_at DESC LIMIT 10"),
      pool.query("SELECT p.id, p.name, p.stock_quantity, p.image FROM products p WHERE p.stock_quantity <= COALESCE(p.low_stock_threshold, 10) AND COALESCE(p.is_active, TRUE) = TRUE ORDER BY p.stock_quantity ASC LIMIT 10")
    ]);

    res.json({
      orders: orders.rows[0],
      revenue: revenue.rows[0],
      customers: customers.rows[0],
      products: products.rows[0],
      recent_pending: pendingOrders.rows,
      low_stock: lowStock.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.get('/sales-chart', adminAuth, async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    let interval = '7 days';
    if (period === '30d') interval = '30 days';
    else if (period === '90d') interval = '90 days';
    
    const result = await pool.query(
      "SELECT DATE(created_at) as date, COUNT(*) as orders, COALESCE(SUM(total_amount),0) as revenue FROM orders WHERE created_at >= CURRENT_DATE - INTERVAL '" + interval + "' AND status != 'Cancelled' GROUP BY DATE(created_at) ORDER BY date ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.get('/top-products', adminAuth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT p.id, p.name, p.image, p.price, SUM(oi.quantity) as total_sold, SUM(oi.quantity * oi.price) as total_revenue FROM order_items oi JOIN products p ON oi.product_id = p.id JOIN orders o ON oi.order_id = o.id WHERE o.status != 'Cancelled' GROUP BY p.id, p.name, p.image, p.price ORDER BY total_sold DESC LIMIT 10"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;

