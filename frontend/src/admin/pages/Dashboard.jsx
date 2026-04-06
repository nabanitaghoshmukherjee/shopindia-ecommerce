import { useState, useEffect } from 'react';
import axios from 'axios';

const token = () => localStorage.getItem('adminToken');
const api = (url) => axios.get(url, { headers: { Authorization: `Bearer ${token()}` } });

function formatCurrency(n) { return '₹' + Number(n || 0).toLocaleString('en-IN'); }

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [chart, setChart] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [period, setPeriod] = useState('7d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api('/api/admin/dashboard/stats'),
      api(`/api/admin/dashboard/sales-chart?period=${period}`),
      api('/api/admin/dashboard/top-products'),
    ]).then(([s, c, t]) => {
      setStats(s.data);
      setChart(c.data);
      setTopProducts(t.data);
    }).finally(() => setLoading(false));
  }, [period]);

  if (loading) return <div style={{textAlign:'center',padding:40}}>Loading dashboard...</div>;
  if (!stats) return <div className="admin-alert admin-alert-error">Failed to load dashboard</div>;

  const o = stats.orders || {};
  const r = stats.revenue || {};

  return (
    <>
      <div className="admin-stats-grid">
        <div className="admin-stat-card primary">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value">{formatCurrency(r.total_revenue)}</div>
          <div className="stat-change positive">This month: {formatCurrency(r.month_revenue)}</div>
        </div>
        <div className="admin-stat-card accent">
          <div className="stat-label">Total Orders</div>
          <div className="stat-value">{o.total || 0}</div>
          <div className="stat-change">Pending: {o.pending || 0} | Delivered: {o.delivered || 0}</div>
        </div>
        <div className="admin-stat-card success">
          <div className="stat-label">Total Customers</div>
          <div className="stat-value">{stats.customers?.total || 0}</div>
          <div className="stat-change positive">+{stats.customers?.new_this_month || 0} this month</div>
        </div>
        <div className="admin-stat-card error">
          <div className="stat-label">Products</div>
          <div className="stat-value">{stats.products?.total || 0}</div>
          <div className="stat-change negative">{stats.products?.out_of_stock || 0} out of stock</div>
        </div>
      </div>

      <div className="admin-grid-2">
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3>Revenue Trend</h3>
            <select value={period} onChange={e => setPeriod(e.target.value)} style={{ padding: '4px 8px', border: '1px solid #ddd', borderRadius: 4 }}>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
          {chart.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead><tr><th>Date</th><th>Orders</th><th>Revenue</th></tr></thead>
                <tbody>
                  {chart.map((d, i) => (
                    <tr key={i}><td>{d.date}</td><td>{d.orders}</td><td>{formatCurrency(d.revenue)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="admin-chart">No data for selected period</div>}
        </div>

        <div className="admin-card">
          <h3>Top Selling Products</h3>
          {topProducts.length > 0 ? (
            <table className="admin-table">
              <thead><tr><th>Product</th><th>Sold</th><th>Revenue</th></tr></thead>
              <tbody>
                {topProducts.map(p => (
                  <tr key={p.id}>
                    <td><div style={{display:'flex',alignItems:'center',gap:8}}><img src={p.image} alt="" style={{width:32,height:32,borderRadius:4,objectFit:'cover'}} />{p.name}</div></td>
                    <td>{p.total_sold}</td>
                    <td>{formatCurrency(p.total_revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p style={{color:'#888'}}>No sales data yet</p>}
        </div>
      </div>

      <div className="admin-grid-2">
        <div className="admin-card">
          <h3>Pending Orders</h3>
          {(stats.recent_pending || []).length > 0 ? (
            <table className="admin-table">
              <thead><tr><th>Order</th><th>Amount</th><th>Date</th></tr></thead>
              <tbody>
                {stats.recent_pending.map(o => (
                  <tr key={o.id}><td>#{o.id}</td><td>{formatCurrency(o.total_amount)}</td><td>{new Date(o.created_at).toLocaleDateString()}</td></tr>
                ))}
              </tbody>
            </table>
          ) : <p style={{color:'#888'}}>No pending orders</p>}
        </div>
        <div className="admin-card">
          <h3>Low Stock Alerts</h3>
          {(stats.low_stock || []).length > 0 ? (
            <table className="admin-table">
              <thead><tr><th>Product</th><th>Stock</th></tr></thead>
              <tbody>
                {stats.low_stock.map(p => (
                  <tr key={p.id}>
                    <td><div style={{display:'flex',alignItems:'center',gap:8}}><img src={p.image} alt="" style={{width:32,height:32,borderRadius:4,objectFit:'cover'}} />{p.name}</div></td>
                    <td className="stock-low">{p.stock_quantity} left</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p style={{color:'var(--success)'}}>All products well stocked ✓</p>}
        </div>
      </div>
    </>
  );
}
