const express = require('express');
const router = express.Router();
const { adminAuth, requirePermission, logAction, pool } = require('../../middleware/adminAuth');

router.get('/', adminAuth, requirePermission('settings'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM settings ORDER BY key');
    const settings = {};
    result.rows.forEach(r => settings[r.key] = r.value);
    res.json(settings);
  } catch (err) { res.status(500).json({ error: 'Database error' }); }
});

router.put('/', adminAuth, requirePermission('settings'), async (req, res) => {
  try {
    const updates = req.body;
    for (const [key, value] of Object.entries(updates)) {
      await pool.query(
        'INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP',
        [key, String(value)]);
    }
    await logAction(req.userId, 'update_settings', 'setting', null, null, updates, req.ip);
    res.json({ message: 'Settings updated' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Database error' }); }
});

module.exports = router;
