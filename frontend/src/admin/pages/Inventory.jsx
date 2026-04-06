import { useState, useEffect } from 'react';
import axios from 'axios';
const T = () => localStorage.getItem('adminToken');
const H = () => ({ headers: { Authorization: `Bearer ${T()}` } });

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [editStock, setEditStock] = useState(null);
  const [stockVal, setStockVal] = useState('');
  const [msg, setMsg] = useState('');

  const load = () => {
    let url = `/api/admin/inventory?page=${page}&limit=20`;
    if (search) url += `&search=${search}`;
    if (lowStock) url += `&low_stock=true`;
    axios.get(url, H()).then(r => { setProducts(r.data.data); setTotal(r.data.total); });
  };
  useEffect(() => { load(); }, [page, search, lowStock]);
  useEffect(() => { axios.get('/api/admin/inventory/warehouses', H()).then(r => setWarehouses(r.data)); }, []);

  const updateStock = async () => {
    await axios.put(`/api/admin/inventory/stock/${editStock}`, { stock_quantity: parseInt(stockVal) }, H());
    setMsg('Stock updated'); setEditStock(null); load();
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <>
      {msg && <div className="admin-alert admin-alert-success">{msg}</div>}
      <div className="admin-filters">
        <input placeholder="Search products..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
          <input type="checkbox" checked={lowStock} onChange={e => setLowStock(e.target.checked)} /> Low stock only
        </label>
      </div>

      {warehouses.length > 0 && (
        <div className="admin-card">
          <h3>Warehouses</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {warehouses.map(w => (
              <div key={w.id} style={{ padding: 12, background: '#f8f9fa', borderRadius: 8, minWidth: 200 }}>
                <strong>{w.name}</strong><br/><small>{w.city}, {w.state}</small>
                <span className={`admin-badge ${w.is_active ? 'admin-badge-active' : 'admin-badge-inactive'}`} style={{marginLeft:8}}>{w.is_active?'Active':'Inactive'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="admin-card">
        <h3>Inventory Overview</h3>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Stock</th><th>Threshold</th><th>Variants</th><th>Actions</th></tr></thead>
            <tbody>
              {products.map(p => (
                <tr key={p.product_id}>
                  <td><div style={{display:'flex',alignItems:'center',gap:8}}><img src={p.image} alt="" style={{width:32,height:32,borderRadius:4,objectFit:'cover'}} />{p.name}</div></td>
                  <td style={{fontSize:12}}>{p.sku||'-'}</td><td>{p.category}</td>
                  <td className={p.stock_quantity <= (p.low_stock_threshold||10) ? 'stock-low' : 'stock-ok'}>{p.stock_quantity}</td>
                  <td>{p.low_stock_threshold||10}</td>
                  <td style={{fontSize:12}}>{(p.variants||[]).filter(v=>v.variant_id).map(v => `${v.variant_name}: ${v.stock}`).join(', ')||'No variants'}</td>
                  <td><button className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => { setEditStock(p.product_id); setStockVal(p.stock_quantity); }}>Update Stock</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="admin-pagination">
          <span>{total} products</span>
          <div className="admin-pagination-buttons">
            <button disabled={page<=1} onClick={() => setPage(p=>p-1)}>Prev</button>
            <span style={{padding:'6px 12px'}}>Page {page}</span>
            <button disabled={products.length<20} onClick={() => setPage(p=>p+1)}>Next</button>
          </div>
        </div>
      </div>

      {editStock && (
        <div className="admin-modal-overlay" onClick={() => setEditStock(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{width:400}}>
            <h2>Update Stock</h2>
            <div className="admin-form-group">
              <label>New Quantity</label>
              <input type="number" value={stockVal} onChange={e => setStockVal(e.target.value)} />
            </div>
            <div className="admin-modal-actions">
              <button className="admin-btn admin-btn-outline" onClick={() => setEditStock(null)}>Cancel</button>
              <button className="admin-btn admin-btn-primary" onClick={updateStock}>Update</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
