import { useState, useEffect } from 'react';
import axios from 'axios';
const T = () => localStorage.getItem('adminToken');
const H = () => ({ headers: { Authorization: `Bearer ${T()}` } });

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    axios.get(`/api/admin/auth/audit-log?page=${page}&limit=50`, H()).then(r => {
      setLogs(r.data.data); setTotal(r.data.total);
    });
  }, [page]);

  return (
    <div className="admin-card">
      <h3>Audit Log ({total} entries)</h3>
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Entity</th><th>Entity ID</th><th>IP</th></tr></thead>
          <tbody>
            {logs.map(l => (
              <tr key={l.id}>
                <td style={{fontSize:12}}>{new Date(l.created_at).toLocaleString()}</td>
                <td>{l.user_name}<br/><small style={{color:'#888'}}>{l.user_email}</small></td>
                <td><span className="admin-badge admin-badge-confirmed">{l.action}</span></td>
                <td>{l.entity_type||'-'}</td>
                <td>{l.entity_id||'-'}</td>
                <td style={{fontSize:12}}>{l.ip_address||'-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="admin-pagination">
        <span>{total} entries</span>
        <div className="admin-pagination-buttons">
          <button disabled={page<=1} onClick={() => setPage(p=>p-1)}>Prev</button>
          <span style={{padding:'6px 12px'}}>Page {page}</span>
          <button disabled={logs.length<50} onClick={() => setPage(p=>p+1)}>Next</button>
        </div>
      </div>
    </div>
  );
}
