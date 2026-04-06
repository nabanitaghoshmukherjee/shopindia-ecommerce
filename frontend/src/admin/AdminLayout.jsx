import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './admin.css';

const navItems = [
  { section: 'Overview' },
  { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { section: 'Store Management' },
  { path: '/admin/products', label: 'Products', icon: '📦' },
  { path: '/admin/orders', label: 'Orders', icon: '🛒' },
  { path: '/admin/inventory', label: 'Inventory', icon: '📋' },
  { path: '/admin/customers', label: 'Customers', icon: '👥' },
  { section: 'Operations' },
  { path: '/admin/payments', label: 'Payments', icon: '💳' },
  { path: '/admin/shipping', label: 'Shipping', icon: '🚚' },
  { path: '/admin/coupons', label: 'Coupons', icon: '🏷️' },
  { path: '/admin/reviews', label: 'Reviews', icon: '⭐' },
  { section: 'Analytics & Config' },
  { path: '/admin/reports', label: 'Reports', icon: '📈' },
  { path: '/admin/settings', label: 'Settings', icon: '⚙️' },
  { path: '/admin/admins', label: 'Admin Users', icon: '🔐' },
  { path: '/admin/audit-log', label: 'Audit Log', icon: '📝' },
];

export default function AdminLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem('adminUser') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <h2>Shop<span>India</span></h2>
        </div>
        <nav className="admin-sidebar-nav">
          {navItems.map((item, i) =>
            item.section ? (
              <div key={i} className="nav-section">{item.section}</div>
            ) : (
              <Link
                key={item.path}
                to={item.path}
                className={location.pathname === item.path ? 'active' : ''}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </Link>
            )
          )}
        </nav>
        <div className="admin-sidebar-footer">
          Logged in as {user.name || user.email || 'Admin'}
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ display: 'none' }}>☰</button>
            <h1>{navItems.find(n => n.path === location.pathname)?.label || 'Admin Panel'}</h1>
          </div>
          <div className="admin-header-actions">
            <Link to="/" className="admin-btn admin-btn-outline admin-btn-sm">View Store</Link>
            <button onClick={handleLogout} className="admin-btn admin-btn-danger admin-btn-sm">Logout</button>
          </div>
        </header>
        <div className="admin-content">{children}</div>
      </main>
    </div>
  );
}
