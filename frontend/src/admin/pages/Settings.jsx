import { useState, useEffect } from 'react';
import axios from 'axios';
const T = () => localStorage.getItem('adminToken');
const H = () => ({ headers: { Authorization: `Bearer ${T()}` } });

export default function Settings() {
  const [settings, setSettings] = useState({});
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/admin/settings', H()).then(r => { setSettings(r.data); setLoading(false); });
  }, []);

  const save = async () => {
    await axios.put('/api/admin/settings', settings, H());
    setMsg('Settings saved!');
    setTimeout(() => setMsg(''), 3000);
  };

  const update = (key, value) => setSettings(s => ({ ...s, [key]: value }));

  if (loading) return <div>Loading...</div>;

  return (
    <>
      {msg && <div className="admin-alert admin-alert-success">{msg}</div>}
      <div className="admin-grid-2">
        <div className="admin-card">
          <h3>General Settings</h3>
          <div className="admin-form-group"><label>Site Name</label><input value={settings.site_name||''} onChange={e => update('site_name', e.target.value)} /></div>
          <div className="admin-form-row">
            <div className="admin-form-group"><label>Currency</label><input value={settings.currency||''} onChange={e => update('currency', e.target.value)} /></div>
            <div className="admin-form-group"><label>Currency Symbol</label><input value={settings.currency_symbol||''} onChange={e => update('currency_symbol', e.target.value)} /></div>
          </div>
        </div>
        <div className="admin-card">
          <h3>Tax Settings</h3>
          <div className="admin-form-group">
            <label>Enable Tax</label>
            <select value={settings.tax_enabled||'false'} onChange={e => update('tax_enabled', e.target.value)}>
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          </div>
          <div className="admin-form-group"><label>Tax Rate (%)</label><input type="number" value={settings.tax_rate||'0'} onChange={e => update('tax_rate', e.target.value)} /></div>
        </div>
        <div className="admin-card">
          <h3>Order Settings</h3>
          <div className="admin-form-group"><label>Minimum Order Value (₹)</label><input type="number" value={settings.min_order_value||'0'} onChange={e => update('min_order_value', e.target.value)} /></div>
          <div className="admin-form-group"><label>Free Shipping Threshold (₹)</label><input type="number" value={settings.free_shipping_threshold||'0'} onChange={e => update('free_shipping_threshold', e.target.value)} /></div>
          <div className="admin-form-group"><label>Shipping Charge (₹)</label><input type="number" value={settings.shipping_charge||'0'} onChange={e => update('shipping_charge', e.target.value)} /></div>
        </div>
        <div className="admin-card">
          <h3>Email Notifications</h3>
          <div className="admin-form-group">
            <label>Order Confirmation</label>
            <select value={settings.order_confirmation_email||'true'} onChange={e => update('order_confirmation_email', e.target.value)}>
              <option value="true">Enabled</option><option value="false">Disabled</option>
            </select>
          </div>
          <div className="admin-form-group">
            <label>Order Shipped</label>
            <select value={settings.order_shipped_email||'true'} onChange={e => update('order_shipped_email', e.target.value)}>
              <option value="true">Enabled</option><option value="false">Disabled</option>
            </select>
          </div>
          <div className="admin-form-group">
            <label>Order Delivered</label>
            <select value={settings.order_delivered_email||'true'} onChange={e => update('order_delivered_email', e.target.value)}>
              <option value="true">Enabled</option><option value="false">Disabled</option>
            </select>
          </div>
        </div>
      </div>
      <button className="admin-btn admin-btn-primary" onClick={save} style={{ marginTop: 16 }}>Save Settings</button>
    </>
  );
}
