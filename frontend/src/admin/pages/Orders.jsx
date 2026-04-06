import { useState, useEffect } from 'react';
import axios from 'axios';
const T = () => localStorage.getItem('adminToken');
const H = () => ({ headers: { Authorization: `Bearer ${T()}` } });
const fmt = n => '₹' + Number(n||0).toLocaleString('en-IN');
const STATUSES = ['Pending','Confirmed','Packed','Shipped','Delivered','Cancelled','Refunded'];
const badgeClass = s => 'admin-badge admin-badge-' + (s||'').toLowerCase();

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [selected, setSelected] = useState([]);
  const [msg, setMsg] = useState('');

  const load = () => {
    let url = `/api/admin/orders?page=${page}&limit=15`;
    if (status) url += `&status=${status}`;
    if (search) url += `&search=${search}`;
    axios.get(url, H()).then(r => { setOrders(r.data.data); setTotal(r.data.total); });
  };
  useEffect(() => { load(); }, [page, status, search]);

  const viewDetail = async (id) => {
    const r = await axios.get(`/api/admin/orders/${id}`, H());
    setDetail(r.data);
  };

  const updateStatus = async (id, newStatus) => {
    await axios.put(`/api/admin/orders/${id}/status`, { status: newStatus }, H());
    setMsg(`Order #${id} → ${newStatus}`); load();
    if (detail?.id === id) viewDetail(id);
    setTimeout(() => setMsg(''), 3000);
  };

  const bulkUpdate = async (newStatus) => {
    if (!selected.length) return;
    await axios.put('/api/admin/orders/bulk/status', { order_ids: selected, status: newStatus }, H());
    setMsg(`${selected.length} orders → ${newStatus}`); setSelected([]); load();
    setTimeout(() => setMsg(''), 3000);
  };

  const viewInvoice = async (id) => {
    const r = await axios.get(`/api/admin/orders/${id}/invoice`, H());
    setInvoice(r.data);
  };

  const toggleSelect = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  return (
    <>
      {msg && <div className="admin-alert admin-alert-success">{msg}</div>}
      <div className="admin-filters">
        <input placeholder="Search orders..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {selected.length > 0 && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#666' }}>{selected.length} selected:</span>
            {STATUSES.map(s => <button key={s} className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => bulkUpdate(s)}>{s}</button>)}
          </div>
        )}
      </div>
      <div className="admin-card">
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr><th><input type="checkbox" onChange={e => setSelected(e.target.checked ? orders.map(o=>o.id) : [])} /></th><th>Order</th><th>Customer</th><th>Amount</th><th>Status</th><th>Payment</th><th>Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id}>
                  <td><input type="checkbox" checked={selected.includes(o.id)} onChange={() => toggleSelect(o.id)} /></td>
                  <td>#{o.id}</td>
                  <td><div>{o.customer_name}</div><div style={{ fontSize: 12, color: '#888' }}>{o.customer_email}</div></td>
                  <td>{fmt(o.total_amount)}</td>
                  <td><span className={badgeClass(o.status)}>{o.status}</span></td>
                  <td style={{ fontSize: 12 }}>{o.payment_id ? o.payment_id.substring(0, 15) : '-'}</td>
                  <td style={{ fontSize: 12 }}>{new Date(o.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => viewDetail(o.id)}>View</button>{' '}
                    <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => viewInvoice(o.id)}>Invoice</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="admin-pagination">
          <span>{total} total orders</span>
          <div className="admin-pagination-buttons">
            <button disabled={page<=1} onClick={() => setPage(p=>p-1)}>Prev</button>
            <span style={{padding:'6px 12px'}}>Page {page}</span>
            <button disabled={orders.length<15} onClick={() => setPage(p=>p+1)}>Next</button>
          </div>
        </div>
      </div>

      {detail && (
        <div className="admin-modal-overlay" onClick={() => setDetail(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ width: 700 }}>
            <h2>Order #{detail.id}</h2>
            <div className="admin-form-row">
              <div><strong>Customer:</strong> {detail.customer_name}<br/><small>{detail.customer_email}</small><br/><small>{detail.customer_phone}</small></div>
              <div><strong>Status:</strong> <span className={badgeClass(detail.status)}>{detail.status}</span><br/><strong>Total:</strong> {fmt(detail.total_amount)}<br/><strong>Payment:</strong> {detail.payment_id || 'N/A'}</div>
            </div>
            {detail.shipping_address && <div style={{ marginTop: 12 }}><strong>Shipping Address:</strong><br/><small>{typeof detail.shipping_address === 'object' ? JSON.stringify(detail.shipping_address) : detail.shipping_address}</small></div>}
            <h3 style={{ marginTop: 16, marginBottom: 8 }}>Items</h3>
            <table className="admin-table">
              <thead><tr><th>Product</th><th>Variant</th><th>Qty</th><th>Price</th></tr></thead>
              <tbody>
                {(detail.items||[]).map(i => (
                  <tr key={i.id}><td><div style={{display:'flex',alignItems:'center',gap:8}}><img src={i.product_image} alt="" style={{width:32,height:32,borderRadius:4,objectFit:'cover'}} />{i.product_name}</div></td><td>{i.variant_name||'-'}</td><td>{i.quantity}</td><td>{fmt(i.price)}</td></tr>
                ))}
              </tbody>
            </table>
            <h3 style={{ marginTop: 16, marginBottom: 8 }}>Update Status</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {STATUSES.map(s => (
                <button key={s} className={`admin-btn admin-btn-sm ${s === detail.status ? 'admin-btn-primary' : 'admin-btn-outline'}`} onClick={() => updateStatus(detail.id, s)}>{s}</button>
              ))}
            </div>
            <div className="admin-modal-actions">
              <button className="admin-btn admin-btn-outline" onClick={() => setDetail(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {invoice && (
        <div className="admin-modal-overlay" onClick={() => setInvoice(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ width: 700 }}>
            <h2>Invoice #{invoice.invoice_number}</h2>
            <div style={{ marginBottom: 16 }}>
              <strong>{invoice.settings?.site_name || 'ShopIndia'}</strong><br/>
              Order #{invoice.order.id} | {new Date(invoice.order.created_at).toLocaleDateString()}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>Customer:</strong> {invoice.order.customer_name} ({invoice.order.customer_email})
            </div>
            <table className="admin-table">
              <thead><tr><th>Item</th><th>SKU</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
              <tbody>
                {invoice.items.map(i => (
                  <tr key={i.id}><td>{i.product_name}{i.variant_name ? ` (${i.variant_name})` : ''}</td><td>{i.sku||'-'}</td><td>{i.quantity}</td><td>{fmt(i.price)}</td><td>{fmt(i.price * i.quantity)}</td></tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <div>Subtotal: {fmt(invoice.subtotal)}</div>
              {invoice.tax_amount > 0 && <div>Tax: {fmt(invoice.tax_amount)}</div>}
              {invoice.discount_amount > 0 && <div>Discount: -{fmt(invoice.discount_amount)}</div>}
              {invoice.shipping_amount > 0 && <div>Shipping: {fmt(invoice.shipping_amount)}</div>}
              <div style={{ fontSize: 18, fontWeight: 'bold', marginTop: 8 }}>Total: {fmt(invoice.total)}</div>
            </div>
            <div className="admin-modal-actions">
              <button className="admin-btn admin-btn-outline" onClick={() => setInvoice(null)}>Close</button>
              <button className="admin-btn admin-btn-primary" onClick={() => window.print()}>Print</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
