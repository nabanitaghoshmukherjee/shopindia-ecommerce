import { useState, useEffect } from 'react';
import axios from 'axios';
const T = () => localStorage.getItem('adminToken');
const H = () => ({ headers: { Authorization: `Bearer ${T()}` } });
const fmt = n => '₹' + Number(n||0).toLocaleString('en-IN');

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [refund, setRefund] = useState(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [msg, setMsg] = useState('');

  const load = () => {
    let url = `/api/admin/payments?page=${page}&limit=20`;
    if (filter) url += `&status=${filter}`;
    axios.get(url, H()).then(r => { setPayments(r.data.data); setTotal(r.data.total); });
  };
  useEffect(() => { load(); }, [page, filter]);

  const processRefund = async () => {
    await axios.post(`/api/admin/payments/refund/${refund}`, { amount: parseInt(refundAmount), reason: refundReason }, H());
    setMsg('Refund processed'); setRefund(null); setRefundAmount(''); setRefundReason(''); load();
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <>
      {msg && <div className="admin-alert admin-alert-success">{msg}</div>}
      <div className="admin-filters">
        <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }}>
          <option value="">All Payments</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>
      <div className="admin-card">
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead><tr><th>Order</th><th>Customer</th><th>Amount</th><th>Payment ID</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.order_id}>
                  <td>#{p.order_id}</td>
                  <td><div>{p.customer_name}</div><small style={{color:'#888'}}>{p.customer_email}</small></td>
                  <td>{fmt(p.total_amount)}</td>
                  <td style={{fontSize:12}}>{p.payment_id || '-'}</td>
                  <td><span className={`admin-badge admin-badge-${(p.status||'').toLowerCase()}`}>{p.status}</span></td>
                  <td style={{fontSize:12}}>{new Date(p.created_at).toLocaleDateString()}</td>
                  <td>
                    {p.status !== 'Refunded' && p.status !== 'Cancelled' && (
                      <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => { setRefund(p.order_id); setRefundAmount(p.total_amount); }}>Refund</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="admin-pagination">
          <span>{total} transactions</span>
          <div className="admin-pagination-buttons">
            <button disabled={page<=1} onClick={() => setPage(p=>p-1)}>Prev</button>
            <span style={{padding:'6px 12px'}}>Page {page}</span>
            <button disabled={payments.length<20} onClick={() => setPage(p=>p+1)}>Next</button>
          </div>
        </div>
      </div>

      {refund && (
        <div className="admin-modal-overlay" onClick={() => setRefund(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{width:450}}>
            <h2>Process Refund - Order #{refund}</h2>
            <div className="admin-form-group"><label>Refund Amount</label><input type="number" value={refundAmount} onChange={e => setRefundAmount(e.target.value)} /></div>
            <div className="admin-form-group"><label>Reason</label><textarea rows={3} value={refundReason} onChange={e => setRefundReason(e.target.value)} placeholder="Reason for refund..." /></div>
            <div className="admin-modal-actions">
              <button className="admin-btn admin-btn-outline" onClick={() => setRefund(null)}>Cancel</button>
              <button className="admin-btn admin-btn-danger" onClick={processRefund}>Process Refund</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
