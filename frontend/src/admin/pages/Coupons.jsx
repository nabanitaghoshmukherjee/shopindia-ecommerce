import { useState, useEffect } from 'react';
import axios from 'axios';
const T = () => localStorage.getItem('adminToken');
const H = () => ({ headers: { Authorization: `Bearer ${T()}` } });

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({ code:'', type:'flat', value:'', min_order_value:'0', max_discount:'', usage_limit:'', start_date:'', end_date:'', is_active:true });
  const [msg, setMsg] = useState('');

  const load = () => {
    axios.get(`/api/admin/coupons?page=${page}&limit=20`, H()).then(r => { setCoupons(r.data.data); setTotal(r.data.total); });
  };
  useEffect(() => { load(); }, [page]);

  const openCreate = () => { setEdit(null); setForm({ code:'', type:'flat', value:'', min_order_value:'0', max_discount:'', usage_limit:'', start_date:'', end_date:'', is_active:true }); setShowModal(true); };
  const openEdit = (c) => { setEdit(c); setForm({ code:c.code, type:c.type, value:c.value, min_order_value:c.min_order_value||'0', max_discount:c.max_discount||'', usage_limit:c.usage_limit||'', start_date:c.start_date?c.start_date.split('T')[0]:'', end_date:c.end_date?c.end_date.split('T')[0]:'', is_active:c.is_active }); setShowModal(true); };

  const save = async () => {
    try {
      if (edit) await axios.put(`/api/admin/coupons/${edit.id}`, form, H());
      else await axios.post('/api/admin/coupons', form, H());
      setMsg('Coupon saved'); setShowModal(false); load();
    } catch(e) { setMsg(e.response?.data?.error || 'Error'); }
    setTimeout(() => setMsg(''), 3000);
  };

  const deleteCoupon = async (id) => {
    if (!confirm('Delete this coupon?')) return;
    await axios.delete(`/api/admin/coupons/${id}`, H());
    setMsg('Deleted'); load(); setTimeout(() => setMsg(''), 3000);
  };

  return (
    <>
      {msg && <div className={`admin-alert ${msg.includes('Error')?'admin-alert-error':'admin-alert-success'}`}>{msg}</div>}
      <div className="admin-filters">
        <button className="admin-btn admin-btn-primary" onClick={openCreate}>+ Create Coupon</button>
      </div>
      <div className="admin-card">
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Min Order</th><th>Usage</th><th>Valid Period</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {coupons.map(c => (
                <tr key={c.id}>
                  <td><strong>{c.code}</strong></td>
                  <td>{c.type}</td>
                  <td>{c.type==='flat' ? `₹${c.value}` : `${c.value}%`}</td>
                  <td>₹{c.min_order_value||0}</td>
                  <td>{c.used_count||0}/{c.usage_limit||'∞'}</td>
                  <td style={{fontSize:12}}>{c.start_date ? new Date(c.start_date).toLocaleDateString() : 'Always'} → {c.end_date ? new Date(c.end_date).toLocaleDateString() : 'No expiry'}</td>
                  <td><span className={`admin-badge ${c.is_active ? 'admin-badge-active' : 'admin-badge-inactive'}`}>{c.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => openEdit(c)}>Edit</button>{' '}
                    <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => deleteCoupon(c.id)}>Del</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h2>{edit ? 'Edit' : 'Create'} Coupon</h2>
            <div className="admin-form-row">
              <div className="admin-form-group"><label>Code *</label><input value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} placeholder="SUMMER2024" /></div>
              <div className="admin-form-group"><label>Type *</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}><option value="flat">Flat (₹)</option><option value="percentage">Percentage (%)</option></select>
              </div>
            </div>
            <div className="admin-form-row">
              <div className="admin-form-group"><label>Value *</label><input type="number" value={form.value} onChange={e => setForm({...form, value: e.target.value})} /></div>
              <div className="admin-form-group"><label>Min Order Value</label><input type="number" value={form.min_order_value} onChange={e => setForm({...form, min_order_value: e.target.value})} /></div>
            </div>
            <div className="admin-form-row">
              <div className="admin-form-group"><label>Max Discount</label><input type="number" value={form.max_discount} onChange={e => setForm({...form, max_discount: e.target.value})} /></div>
              <div className="admin-form-group"><label>Usage Limit</label><input type="number" value={form.usage_limit} onChange={e => setForm({...form, usage_limit: e.target.value})} /></div>
            </div>
            <div className="admin-form-row">
              <div className="admin-form-group"><label>Start Date</label><input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} /></div>
              <div className="admin-form-group"><label>End Date</label><input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} /></div>
            </div>
            <div className="admin-modal-actions">
              <button className="admin-btn admin-btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="admin-btn admin-btn-primary" onClick={save}>{edit?'Update':'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
