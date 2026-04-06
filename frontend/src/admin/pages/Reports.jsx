import { useState, useEffect } from 'react';
import axios from 'axios';
const T = () => localStorage.getItem('adminToken');
const H = () => ({ headers: { Authorization: `Bearer ${T()}` } });
const fmt = n => '₹' + Number(n||0).toLocaleString('en-IN');

export default function Reports() {
  const [tab, setTab] = useState('sales');
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [groupBy, setGroupBy] = useState('day');

  const load = () => {
    let params = `date_from=${dateFrom}&date_to=${dateTo}`;
    if (tab === 'sales') {
      axios.get(`/api/admin/reports/sales?${params}&group_by=${groupBy}`, H()).then(r => setSales(r.data));
    } else if (tab === 'products') {
      axios.get(`/api/admin/reports/products?${params}&limit=50`, H()).then(r => setProducts(r.data));
    } else if (tab === 'categories') {
      axios.get(`/api/admin/reports/categories`, H()).then(r => setCategories(r.data));
    }
  };
  useEffect(() => { load(); }, [tab, dateFrom, dateTo, groupBy]);

  const exportCSV = () => {
    window.open(`/api/admin/reports/sales/export?date_from=${dateFrom}&date_to=${dateTo}&token=${T()}`, '_blank');
  };

  const totalRevenue = sales.reduce((s, r) => s + Number(r.revenue), 0);
  const totalOrders = sales.reduce((s, r) => s + Number(r.orders), 0);

  return (
    <>
      <div className="admin-filters">
        <button className={`admin-btn ${tab==='sales'?'admin-btn-primary':'admin-btn-outline'}`} onClick={() => setTab('sales')}>Sales</button>
        <button className={`admin-btn ${tab==='products'?'admin-btn-primary':'admin-btn-outline'}`} onClick={() => setTab('products')}>Products</button>
        <button className={`admin-btn ${tab==='categories'?'admin-btn-primary':'admin-btn-outline'}`} onClick={() => setTab('categories')}>Categories</button>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        <span>to</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        {tab === 'sales' && (
          <select value={groupBy} onChange={e => setGroupBy(e.target.value)}>
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </select>
        )}
        <button className="admin-btn admin-btn-outline" onClick={exportCSV}>Export CSV</button>
      </div>

      {tab === 'sales' && (
        <>
          <div className="admin-stats-grid">
            <div className="admin-stat-card primary"><div className="stat-label">Total Revenue</div><div className="stat-value">{fmt(totalRevenue)}</div></div>
            <div className="admin-stat-card accent"><div className="stat-label">Total Orders</div><div className="stat-value">{totalOrders}</div></div>
            <div className="admin-stat-card success"><div className="stat-label">Avg Order Value</div><div className="stat-value">{totalOrders > 0 ? fmt(Math.round(totalRevenue/totalOrders)) : '₹0'}</div></div>
          </div>
          <div className="admin-card">
            <h3>Sales Report</h3>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead><tr><th>Period</th><th>Orders</th><th>Revenue</th><th>Avg Order</th></tr></thead>
                <tbody>
                  {sales.map((s, i) => (
                    <tr key={i}><td>{s.period}</td><td>{s.orders}</td><td>{fmt(s.revenue)}</td><td>{fmt(s.avg_order_value)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'products' && (
        <div className="admin-card">
          <h3>Product Performance</h3>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Sold</th><th>Revenue</th><th>Orders</th></tr></thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td><div style={{display:'flex',alignItems:'center',gap:8}}><img src={p.image} alt="" style={{width:32,height:32,borderRadius:4,objectFit:'cover'}} />{p.name}</div></td>
                    <td>{p.category}</td><td>{fmt(p.price)}</td><td>{p.total_sold}</td><td>{fmt(p.total_revenue)}</td><td>{p.order_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'categories' && (
        <div className="admin-card">
          <h3>Category Performance</h3>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead><tr><th>Category</th><th>Products</th><th>Units Sold</th><th>Revenue</th></tr></thead>
              <tbody>
                {categories.map((c, i) => (
                  <tr key={i}><td>{c.category}</td><td>{c.product_count}</td><td>{c.total_sold}</td><td>{fmt(c.total_revenue)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
