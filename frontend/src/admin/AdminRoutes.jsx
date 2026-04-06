import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import AdminLogin from './AdminLogin';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Customers from './pages/Customers';
import Inventory from './pages/Inventory';
import Payments from './pages/Payments';
import Shipping from './pages/Shipping';
import Coupons from './pages/Coupons';
import Reviews from './pages/Reviews';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import AdminUsers from './pages/AdminUsers';
import AuditLog from './pages/AuditLog';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('adminToken');
  if (!token) return <Navigate to="/admin/login" replace />;
  return <AdminLayout>{children}</AdminLayout>;
}

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="login" element={<AdminLogin />} />
      <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
      <Route path="orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
      <Route path="customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
      <Route path="inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
      <Route path="payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
      <Route path="shipping" element={<ProtectedRoute><Shipping /></ProtectedRoute>} />
      <Route path="coupons" element={<ProtectedRoute><Coupons /></ProtectedRoute>} />
      <Route path="reviews" element={<ProtectedRoute><Reviews /></ProtectedRoute>} />
      <Route path="reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="admins" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
      <Route path="audit-log" element={<ProtectedRoute><AuditLog /></ProtectedRoute>} />
      <Route path="" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}
