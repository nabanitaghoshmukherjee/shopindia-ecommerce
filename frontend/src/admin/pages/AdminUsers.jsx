import { useState, useEffect } from 'react';
import axios from 'axios';
const T = () => localStorage.getItem('adminToken');
const H = () => ({ headers: { Authorization: `Bearer ${T()}` } });

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ email:'', password:'', name:'', phone:'', role_id:'' });
  const [msg, setMsg] = useState('');

  const load = () => {
    axios.get('/api/admin/auth/users', H()).then(r => setUsers(r.data));
    axios.get('/api/admin/auth/roles', H()).then(r => setRoles(r.data));
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditUser(null); setForm({ email:'', password:'', name:'', phone:'', role_id:'' }); setShowModal(true); };
  const openEdit = (u) => { setEditUser(u); setForm({ email:u.email, password:'', name:u.name, phone:u.phone||'', role_id:u.role_id||'' }); setShowModal(true); };

  const save = async () => {
    try {
      if (editUser) {
        const data = { name: form.name, phone: form.phone, role_id: form.role_id || null };
        if (form.password) data.password = form.password;
        await axios.put(`/api/admin/auth/users/${editUser.id}`, data, H());
      } else {
        await axios.post('/api/admin/auth/users', form, H());
      }
      setMsg('Admin user saved'); setShowModal(false); load();
    } catch(e) { setMsg(e.response?.data?.error || 'Error'); }
    setTimeout(() => setMsg(''), 3000);
  };

  const deactivate = async (id) => {
    if (!confirm('Deactivate this admin?')) return;
    await axios.delete(`/api/admin/auth/users/${id}`, H());
    setMsg('Admin deactivated'); load(); setTimeout(() => setMsg(''), 3000);
  };

  return (
    <>
      {msg && <div className={`admin-alert ${msg.includes('Error')?'admin-alert-error':'admin-alert-success'}`}>{msg}</div>}
      <div className="admin-filters">
        <button className="admin-btn admin-btn-primary" onClick={openCreate}>+ Add Admin</button>
      </div>
      <div className="admin-card">
        <h3>Admin Users</h3>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last Login</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.name}</td><td>{u.email}</td>
                  <td><span className="admin-badge admin-badge-confirmed">{u.role_name || 'Admin'}</span></td>
                  <td><span className={`admin-badge ${u.is_active !== false ? 'admin-badge-active' : 'admin-badge-inactive'}`}>{u.is_active !== false ? 'Active' : 'Inactive'}</span></td>
                  <td style={{fontSize:12}}>{u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}</td>
                  <td>
                    <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => openEdit(u)}>Edit</button>{' '}
                    {u.is_active !== false && <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => deactivate(u.id)}>Deactivate</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-card">
        <h3>Roles & Permissions</h3>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead><tr><th>Role</th><th>Permissions</th></tr></thead>
            <tbody>
              {roles.map(r => (
                <tr key={r.id}>
                  <td><strong>{r.name}</strong></td>
                  <td style={{fontSize:12}}>{Object.entries(r.permissions||{}).filter(([,v])=>v).map(([k])=>k).join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{width:500}}>
            <h2>{editUser ? 'Edit' : 'Add'} Admin User</h2>
            <div className="admin-form-row">
              <div className="admin-form-group"><label>Name *</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
              <div className="admin-form-group"><label>Email *</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} disabled={!!editUser} /></div>
            </div>
            <div className="admin-form-row">
              <div className="admin-form-group"><label>{editUser ? 'New Password (leave blank to keep)' : 'Password *'}</label><input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} /></div>
              <div className="admin-form-group"><label>Phone</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
            </div>
            <div className="admin-form-group"><label>Role</label>
              <select value={form.role_id} onChange={e => setForm({...form, role_id: e.target.value})}>
                <option value="">Select Role</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="admin-modal-actions">
              <button className="admin-btn admin-btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="admin-btn admin-btn-primary" onClick={save}>{editUser ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
