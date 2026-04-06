import { useState, useEffect } from 'react';
import axios from 'axios';
const T = () => localStorage.getItem('adminToken');
const H = () => ({ headers: { Authorization: `Bearer ${T()}` } });
const fmt = n => '₹' + Number(n||0).toLocaleString('en-IN');

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState(null);
  const [msg, setMsg] = useState('');

  const load = () => {
    let url = `/api/admin/customers?page=${page}&limit=20`;
    if (search) url += `&search=${search}`;
    axios.get(url, H()).then(r => { setCustomers(r.data.data); setTotal(r.data.total); });
  };
  useEffect(() => { load(); }, [page, search]);

  const viewDetail = async (id) => {
    const r = await axios.get(`/api/admin/customers/${id}`, H());
    setDetail(r.data);
  };

  const toggleStatus = async (id, active) => {
    await axios.put(`/api/admin/customers/${id}/status`, { is_active: !active }, H());
    setMsg('Customer status updated'); load();
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <>
      {msg && <div className="admin-alert admin-alert-success">{msg}</div>}
      <div className="admin-filters">
        <input placeholder="Search customers..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
      </div>
      <div className="admin-card">
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Orders</th><th>Total Spent</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id}>
                  <td>{c.id}</td><td>{c.name}</td><td>{c.email}</td><td>{c.phone||'-'}</td>
                  <td>{c.order_count}</td><td>{fmt(c.total_spent)}</td>
                  <td><span className={`admin-badge ${c.is_active !== false ? 'admin-badge-active' : 'admin-badge-inactive'}`}>{c.is_active !== false ? 'Active' : 'Inactive'}</span></td>
                  <td style={{fontSize:12}}>{new Date(c.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => viewDetail(c.id)}>View</button>{' '}
                    <button className="admin-btn admin-btn-sm" style={{background:c.is_active!==false?'#f8d7da':'#d4edda',color:c.is_active!==false?'#721c24':'#155724'}} onClick={() => toggleStatus(c.id, c.is_active!==false)}>{c.is_active!==false?'Block':'Unblock'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="admin-pagination">
          <span>{total} customers</span>
          <div className="admin-pagination-buttons">
            <button disabled={page<=1} onClick={() => setPage(p=>p-1)}>Prev</button>
            <span style={{padding:'6px 12px'}}>Page {page}</span>
            <button disabled={customers.length<20} onClick={() => setPage(p=>p+1)}>Next</button>
          </div>
        </div>
      </div>

      {detail && (
        <div className="admin-modal-overlay" onClick={() => setDetail(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{width:700}}>
            <h2>{detail.name}</h2>
            <p>{detail.email} | {detail.phone||'No phone'}</p>
            <h3 style={{marginTop:16}}>Addresses</h3>
            {(detail.addresses||[]).length > 0 ? detail.addresses.map(a => (
              <div key={a.id} style={{padding:8,background:'#f8f9fa',borderRadius:4,marginBottom:8}}>
                {a.name} - {a.address_line1}, {a.city}, {a.state} {a.postal_code}
              </div>
            )) : <p style={{color:'#888'}}>No addresses</p>}
            <h3 style={{marginTop:16}}>Recent Orders</h3>
            <table className="admin-table">
              <thead><tr><th>Order</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {(detail.orders||[]).map(o => (
                  <tr key={o.id}><td>#{o.id}</td><td>{fmt(o.total_amount)}</td><td><span className={`admin-badge admin-badge-${(o.status||'').toLowerCase()}`}>{o.status}</span></td><td>{new Date(o.created_at).toLocaleDateString()}</td></tr>
                ))}
              </tbody>
            </table>
            <div className="admin-modal-actions"><button className="admin-btn admin-btn-outline" onClick={() => setDetail(null)}>Close</button></div>
          </div>
        </div>
      )}
    </>
  );
}
