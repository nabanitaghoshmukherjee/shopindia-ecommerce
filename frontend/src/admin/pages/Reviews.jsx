import { useState, useEffect } from 'react';
import axios from 'axios';
const T = () => localStorage.getItem('adminToken');
const H = () => ({ headers: { Authorization: `Bearer ${T()}` } });

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [msg, setMsg] = useState('');

  const load = () => {
    let url = `/api/admin/reviews?page=${page}&limit=20`;
    if (filter) url += `&is_approved=${filter}`;
    axios.get(url, H()).then(r => { setReviews(r.data.data); setTotal(r.data.total); });
  };
  useEffect(() => { load(); }, [page, filter]);

  const approve = async (id) => {
    await axios.put(`/api/admin/reviews/${id}/approve`, {}, H());
    setMsg('Review approved'); load(); setTimeout(() => setMsg(''), 3000);
  };
  const reject = async (id) => {
    await axios.put(`/api/admin/reviews/${id}/reject`, {}, H());
    setMsg('Review rejected'); load(); setTimeout(() => setMsg(''), 3000);
  };
  const remove = async (id) => {
    if (!confirm('Delete this review?')) return;
    await axios.delete(`/api/admin/reviews/${id}`, H());
    setMsg('Review deleted'); load(); setTimeout(() => setMsg(''), 3000);
  };

  const stars = (r) => '★'.repeat(r) + '☆'.repeat(5-r);

  return (
    <>
      {msg && <div className="admin-alert admin-alert-success">{msg}</div>}
      <div className="admin-filters">
        <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }}>
          <option value="">All Reviews</option>
          <option value="false">Pending Approval</option>
          <option value="true">Approved</option>
        </select>
      </div>
      <div className="admin-card">
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead><tr><th>Product</th><th>User</th><th>Rating</th><th>Title</th><th>Comment</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {reviews.map(r => (
                <tr key={r.id}>
                  <td><div style={{display:'flex',alignItems:'center',gap:8}}><img src={r.product_image} alt="" style={{width:32,height:32,borderRadius:4,objectFit:'cover'}} />{r.product_name}</div></td>
                  <td>{r.user_name}<br/><small style={{color:'#888'}}>{r.user_email}</small></td>
                  <td style={{color:'var(--primary)'}}>{stars(r.rating)}</td>
                  <td>{r.title||'-'}</td>
                  <td style={{maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.comment||'-'}</td>
                  <td><span className={`admin-badge ${r.is_approved ? 'admin-badge-active' : 'admin-badge-pending'}`}>{r.is_approved ? 'Approved' : 'Pending'}</span></td>
                  <td style={{fontSize:12}}>{new Date(r.created_at).toLocaleDateString()}</td>
                  <td>
                    {!r.is_approved && <button className="admin-btn admin-btn-success admin-btn-sm" onClick={() => approve(r.id)}>Approve</button>}{' '}
                    {r.is_approved && <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => reject(r.id)}>Reject</button>}{' '}
                    <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => remove(r.id)}>Del</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
