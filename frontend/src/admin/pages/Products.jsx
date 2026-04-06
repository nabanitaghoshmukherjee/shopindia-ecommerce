import { useState, useEffect } from 'react';
import axios from 'axios';
const T = () => localStorage.getItem('adminToken');
const H = () => ({ headers: { Authorization: `Bearer ${T()}` } });

export default function Products() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: '', category: '', price: '', original_price: '', description: '', image: '', badge: '', brand: '', stock_quantity: '0' });
  const [msg, setMsg] = useState('');

  const load = () => {
    let url = `/api/admin/products?page=${page}&limit=15`;
    if (search) url += `&search=${search}`;
    if (category) url += `&category=${category}`;
    axios.get(url, H()).then(r => { setProducts(r.data.data); setTotal(r.data.total); });
  };
  useEffect(() => { load(); }, [page, search, category]);
  useEffect(() => { axios.get('/api/categories').then(r => setCategories(r.data)); }, []);

  const openCreate = () => { setEditProduct(null); setForm({ name: '', category: '', price: '', original_price: '', description: '', image: '', badge: '', brand: '', stock_quantity: '0' }); setShowModal(true); };
  const openEdit = (p) => { setEditProduct(p); setForm({ name: p.name, category: p.category, price: p.price, original_price: p.original_price || '', description: p.description || '', image: p.image || '', badge: p.badge || '', brand: p.brand || '', stock_quantity: p.stock_quantity || '0' }); setShowModal(true); };

  const save = async () => {
    try {
      if (editProduct) {
        await axios.put(`/api/admin/products/${editProduct.id}`, form, H());
        setMsg('Product updated!');
      } else {
        await axios.post('/api/admin/products', form, H());
        setMsg('Product created!');
      }
      setShowModal(false); load();
    } catch (e) { setMsg(e.response?.data?.error || 'Error'); }
    setTimeout(() => setMsg(''), 3000);
  };

  const deleteProduct = async (id) => {
    if (!confirm('Delete this product?')) return;
    await axios.delete(`/api/admin/products/${id}`, H());
    setMsg('Product deleted'); load();
    setTimeout(() => setMsg(''), 3000);
  };

  const handleBulkUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData(); fd.append('file', file);
    try {
      const r = await axios.post('/api/admin/products/bulk-upload', fd, { ...H(), headers: { ...H().headers, 'Content-Type': 'multipart/form-data' } });
      setMsg(r.data.message); load();
    } catch (err) { setMsg('Upload failed'); }
    setTimeout(() => setMsg(''), 3000);
  };

  const totalPages = Math.ceil(total / 15);

  return (
    <>
      {msg && <div className={`admin-alert ${msg.includes('Error') || msg.includes('fail') ? 'admin-alert-error' : 'admin-alert-success'}`}>{msg}</div>}
      <div className="admin-filters">
        <input placeholder="Search products..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
        <button className="admin-btn admin-btn-primary" onClick={openCreate}>+ Add Product</button>
        <label className="admin-btn admin-btn-outline" style={{ cursor: 'pointer' }}>
          Bulk Upload
          <input type="file" accept=".xlsx,.xls,.csv" onChange={handleBulkUpload} style={{ display: 'none' }} />
        </label>
        <a href="/api/admin/products/sample" className="admin-btn admin-btn-outline">Download Sample</a>
      </div>
      <div className="admin-card">
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr><th>ID</th><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>SKU</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td><img src={p.image} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} /></td>
                  <td style={{ maxWidth: 200 }}>{p.name}</td>
                  <td>{p.category}</td>
                  <td>₹{Number(p.price).toLocaleString()}</td>
                  <td className={p.stock_quantity <= (p.low_stock_threshold || 10) ? 'stock-low' : 'stock-ok'}>{p.stock_quantity || 0}</td>
                  <td style={{ fontSize: 12 }}>{p.sku || '-'}</td>
                  <td><span className={`admin-badge ${p.in_stock ? 'admin-badge-active' : 'admin-badge-inactive'}`}>{p.in_stock ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => openEdit(p)}>Edit</button>{' '}
                    <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => deleteProduct(p.id)}>Del</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="admin-pagination">
          <span>Showing {products.length} of {total} products</span>
          <div className="admin-pagination-buttons">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              return p <= totalPages ? <button key={p} className={p === page ? 'active' : ''} onClick={() => setPage(p)}>{p}</button> : null;
            })}
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h2>{editProduct ? 'Edit Product' : 'Add Product'}</h2>
            <div className="admin-form-row">
              <div className="admin-form-group"><label>Name *</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
              <div className="admin-form-group"><label>Category *</label>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                  <option value="">Select</option>
                  {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="admin-form-row">
              <div className="admin-form-group"><label>Price *</label><input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} /></div>
              <div className="admin-form-group"><label>Original Price</label><input type="number" value={form.original_price} onChange={e => setForm({...form, original_price: e.target.value})} /></div>
            </div>
            <div className="admin-form-row">
              <div className="admin-form-group"><label>Brand</label><input value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} /></div>
              <div className="admin-form-group"><label>Stock</label><input type="number" value={form.stock_quantity} onChange={e => setForm({...form, stock_quantity: e.target.value})} /></div>
            </div>
            <div className="admin-form-group"><label>Image URL</label><input value={form.image} onChange={e => setForm({...form, image: e.target.value})} /></div>
            <div className="admin-form-row">
              <div className="admin-form-group"><label>Badge</label><input value={form.badge} onChange={e => setForm({...form, badge: e.target.value})} placeholder="e.g. Best Seller" /></div>
            </div>
            <div className="admin-form-group"><label>Description</label><textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
            <div className="admin-modal-actions">
              <button className="admin-btn admin-btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="admin-btn admin-btn-primary" onClick={save}>{editProduct ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
