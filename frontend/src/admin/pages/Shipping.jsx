import { useState, useEffect } from 'react';
import axios from 'axios';
const T = () => localStorage.getItem('adminToken');
const H = () => ({ headers: { Authorization: `Bearer ${T()}` } });

export default function Shipping() {
  const [shipments, setShipments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ order_id: '', courier_name: '', tracking_number: '', status: 'shipped' });
  const [msg, setMsg] = useState('');

  const load = () => {
    let url = `/api/admin/shipping?page=${page}&limit=20`;
    if (status) url += `&status=${status}`;
    axios.get(url, H()).then(r => { setShipments(r.data.data); setTotal(r.data.total); });
  };
  useEffect(() => { load(); }, [page, status]);

  const create = async () => {
    await axios.post('/api/admin/shipping', form, H());
    setMsg('Shipment created'); setShowModal(false); load();
    setForm({ order_id: '', courier_name: '', tracking_number: '', status: 'shipped' });
    setTimeout(() => setMsg(''), 3000);
  };

  const updateStatus = async (id, newStatus) => {
    await axios.put(`/api/admin/shipping/${id}/status`, { status: newStatus }, H());
    setMsg('Status updated'); load();
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <>
      {msg && <div className="admin-alert admin-alert-success">{msg}</div>}
      <div className="admin-filters">
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="shipped">Shipped</option>
          <option value="in_transit">In Transit</option>
          <option value="delivered">Delivered</option>
          <option value="returned">Returned</option>
          <option value="rto">RTO</option>
        </select>
        <button className="admin-btn admin-btn-primary" onClick={() => setShowModal(true)}>+ Create Shipment</button>
      </div>
      <div className="admin-card">
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead><tr><th>ID</th><th>Order</th><th>Customer</th><th>Courier</th><th>Tracking</th><th>Status</th><th>Shipped</th><th>Delivered</th><th>Actions</th></tr></thead>
            <tbody>
              {shipments.map(s => (
                <tr key={s.id}>
                  <td>{s.id}</td><td>#{s.order_id}</td>
                  <td>{s.customer_name}</td>
                  <td>{s.courier_name||'-'}</td>
                  <td style={{fontSize:12}}>{s.tracking_number||'-'}</td>
                  <td><span className={`admin-badge admin-badge-${(s.status||'pending')==='delivered'?'delivered':(s.status||'pending')==='shipped'?'shipped':'pending'}`}>{s.status}</span></td>
                  <td style={{fontSize:12}}>{s.shipped_at ? new Date(s.shipped_at).toLocaleDateString() : '-'}</td>
                  <td style={{fontSize:12}}>{s.delivered_at ? new Date(s.delivered_at).toLocaleDateString() : '-'}</td>
                  <td>
                    <select className="admin-btn admin-btn-outline admin-btn-sm" value={s.status} onChange={e => updateStatus(s.id, e.target.value)} style={{padding:'4px 8px'}}>
                      <option value="pending">Pending</option>
                      <option value="shipped">Shipped</option>
                      <option value="in_transit">In Transit</option>
                      <option value="delivered">Delivered</option>
                      <option value="returned">Returned</option>
                      <option value="rto">RTO</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{width:500}}>
            <h2>Create Shipment</h2>
            <div className="admin-form-group"><label>Order ID *</label><input type="number" value={form.order_id} onChange={e => setForm({...form, order_id: e.target.value})} /></div>
            <div className="admin-form-row">
              <div className="admin-form-group"><label>Courier Name</label><input value={form.courier_name} onChange={e => setForm({...form, courier_name: e.target.value})} placeholder="e.g. Delhivery" /></div>
              <div className="admin-form-group"><label>Tracking Number</label><input value={form.tracking_number} onChange={e => setForm({...form, tracking_number: e.target.value})} /></div>
            </div>
            <div className="admin-modal-actions">
              <button className="admin-btn admin-btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="admin-btn admin-btn-primary" onClick={create}>Create</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
