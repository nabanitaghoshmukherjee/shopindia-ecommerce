const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { adminAuth, requirePermission, logAction, pool, JWT_SECRET } = require('../../middleware/adminAuth');

// Admin login (uses same users table, checks is_admin or role_id)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query(
      `SELECT u.*, ar.name as role_name, ar.permissions 
       FROM users u LEFT JOIN admin_roles ar ON u.role_id = ar.id 
       WHERE u.email = $1 AND u.password = $2 AND u.is_active = TRUE`,
      [email, password]
    );
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const user = result.rows[0];
    if (!user.is_admin && !user.role_id) return res.status(403).json({ error: 'Not an admin user' });
    
    await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);
    const token = jwt.sign({ userId: user.id, role: user.role_name }, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role_name, permissions: user.permissions } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// List all admin users
router.get('/users', adminAuth, requirePermission('admins'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.name, u.phone, u.is_admin, u.is_active, u.last_login, u.created_at,
              ar.name as role_name, ar.id as role_id
       FROM users u LEFT JOIN admin_roles ar ON u.role_id = ar.id
       WHERE u.is_admin = TRUE OR u.role_id IS NOT NULL
       ORDER BY u.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Create admin user
router.post('/users', adminAuth, requirePermission('admins'), async (req, res) => {
  try {
    const { email, password, name, phone, role_id } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'Email, password, and name are required' });
    
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Email already exists' });
    
    const result = await pool.query(
      `INSERT INTO users (email, password, name, phone, is_admin, role_id) 
       VALUES ($1, $2, $3, $4, TRUE, $5) RETURNING id, email, name, is_admin, role_id`,
      [email, password, name, phone || null, role_id || null]
    );
    await logAction(req.userId, 'create_admin', 'user', result.rows[0].id, null, result.rows[0], req.ip);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Update admin user
router.put('/users/:id', adminAuth, requirePermission('admins'), async (req, res) => {
  try {
    const { name, phone, role_id, is_active, password } = req.body;
    const old = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (old.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    let query, params;
    if (password) {
      query = `UPDATE users SET name=COALESCE($1,name), phone=COALESCE($2,phone), role_id=COALESCE($3,role_id), 
               is_active=COALESCE($4,is_active), password=$5, updated_at=CURRENT_TIMESTAMP WHERE id=$6 RETURNING id,email,name,role_id,is_active`;
      params = [name, phone, role_id, is_active, password, req.params.id];
    } else {
      query = `UPDATE users SET name=COALESCE($1,name), phone=COALESCE($2,phone), role_id=COALESCE($3,role_id), 
               is_active=COALESCE($4,is_active), updated_at=CURRENT_TIMESTAMP WHERE id=$5 RETURNING id,email,name,role_id,is_active`;
      params = [name, phone, role_id, is_active, req.params.id];
    }
    
    const result = await pool.query(query, params);
    await logAction(req.userId, 'update_admin', 'user', req.params.id, old.rows[0], result.rows[0], req.ip);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Delete admin user
router.delete('/users/:id', adminAuth, requirePermission('admins'), async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.userId) return res.status(400).json({ error: 'Cannot delete yourself' });
    const old = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (old.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    
    await pool.query('UPDATE users SET is_active = FALSE WHERE id = $1', [req.params.id]);
    await logAction(req.userId, 'deactivate_admin', 'user', req.params.id, old.rows[0], null, req.ip);
    res.json({ message: 'Admin deactivated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get roles
router.get('/roles', adminAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM admin_roles ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Audit log
router.get('/audit-log', adminAuth, requirePermission('settings'), async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const result = await pool.query(
      `SELECT al.*, u.name as user_name, u.email as user_email 
       FROM audit_log al LEFT JOIN users u ON al.user_id = u.id 
       ORDER BY al.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    const count = await pool.query('SELECT COUNT(*) FROM audit_log');
    res.json({ data: result.rows, total: parseInt(count.rows[0].count), page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
