const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'shopindia_secret_key_2024';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'shopindia',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

// Verify admin is authenticated and has admin role
const adminAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized: No token' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await pool.query(
      `SELECT u.*, ar.name as role_name, ar.permissions 
       FROM users u 
       LEFT JOIN admin_roles ar ON u.role_id = ar.id 
       WHERE u.id = $1 AND u.is_active = TRUE`,
      [decoded.userId]
    );

    if (user.rows.length === 0) return res.status(401).json({ error: 'User not found' });
    if (!user.rows[0].is_admin && !user.rows[0].role_id) {
      return res.status(403).json({ error: 'Access denied: Not an admin' });
    }

    req.user = user.rows[0];
    req.userId = user.rows[0].id;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Check specific permission
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    // Super admin bypass
    if (req.user.role_name === 'super_admin') return next();
    
    const perms = req.user.permissions || {};
    if (perms[permission]) return next();
    
    return res.status(403).json({ error: `Access denied: Missing '${permission}' permission` });
  };
};

// Log admin action
const logAction = async (userId, action, entityType, entityId, oldData, newData, ip) => {
  try {
    await pool.query(
      `INSERT INTO audit_log (user_id, action, entity_type, entity_id, old_data, new_data, ip_address) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, action, entityType, entityId, JSON.stringify(oldData), JSON.stringify(newData), ip]
    );
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
};

module.exports = { adminAuth, requirePermission, logAction, pool, JWT_SECRET };
