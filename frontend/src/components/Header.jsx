import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import axios from 'axios'

const Header = ({ onMenuOpen }) => {
  const [search, setSearch] = useState('')
  const { user, logout } = useAuth()
  const { cartCount } = useCart()
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) navigate(`/products?search=${encodeURIComponent(search.trim())}`)
  }

  return (
    <header className="header">
      <div className="header-main">
        {/* Left: Hamburger + Logo */}
        <div className="header-left">
          <button className="header-hamburger" onClick={onMenuOpen} aria-label="Menu">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
          </button>
          <Link to="/" className="header-logo">Shop<span>India</span>.in</Link>
        </div>

        {/* Center: Search Bar */}
        <form className="header-search" onSubmit={handleSearch}>
          <input className="header-search-input" type="text" placeholder="Search ShopIndia.in" value={search} onChange={e => setSearch(e.target.value)} />
          <button className="header-search-btn" type="submit">
            <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
          </button>
        </form>

        {/* Right: Account + Cart */}
        <div className="header-right">
          {user ? (
            <div className="header-nav-item">
              <div className="header-nav-line1">Hello, {user.name?.split(' ')[0]}</div>
              <div className="header-nav-line2" onClick={logout} style={{cursor:'pointer'}}>Sign out</div>
            </div>
          ) : (
            <Link to="/login" className="header-nav-item">
              <div className="header-nav-line1">Hello, Sign in</div>
              <div className="header-nav-line2">Account</div>
            </Link>
          )}

          <Link to="/cart" className="header-cart">
            <svg viewBox="0 0 24 24"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1.003 1.003 0 0020 7H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>
            <span className="header-cart-count">{cartCount}</span>
            <span className="header-cart-text">Cart</span>
          </Link>
        </div>
      </div>

      {/* Desktop sub-nav */}
      <DesktopSubNav />
    </header>
  )
}

const DesktopSubNav = () => {
  const [categories, setCategories] = useState([])
  useEffect(() => {
    axios.get('/api/categories').then(r => setCategories(r.data)).catch(() => {})
  }, [])

  return (
    <div className="header-sub">
      <Link to="/products">All</Link>
      {categories.map(c => (
        <Link key={c.id} to={`/products/${c.slug}`}>{c.name}</Link>
      ))}
      <Link to="#">Today's Deals</Link>
      <Link to="#">Customer Service</Link>
      <Link to="#">Gift Ideas</Link>
      <Link to="#">Sell</Link>
    </div>
  )
}

// Side Menu (mobile)
export const SideMenu = ({ open, onClose }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])

  useEffect(() => {
    axios.get('/api/categories').then(r => setCategories(r.data)).catch(() => {})
  }, [])

  const handleLogout = () => { logout(); onClose(); navigate('/') }

  return (
    <>
      <div className={`side-menu-overlay ${open ? 'open' : ''}`} onClick={onClose} />
      <div className={`side-menu ${open ? 'open' : ''}`}>
        <div className="side-menu-header">
          <svg viewBox="0 0 24 24" fill="white"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          {user ? `Hello, ${user.name}` : 'Hello, Sign in'}
        </div>

        {!user && (
          <div className="side-menu-section">
            <Link to="/login" className="side-menu-item" onClick={onClose}>Sign in to your account</Link>
            <Link to="/register" className="side-menu-item" onClick={onClose}>Create a new account</Link>
          </div>
        )}

        <div className="side-menu-section">
          <div className="side-menu-section-title">Shop By Department</div>
          {categories.map(c => (
            <Link key={c.id} to={`/products/${c.slug}`} className="side-menu-item" onClick={onClose}>{c.name}</Link>
          ))}
        </div>

        <div className="side-menu-section">
          <div className="side-menu-section-title">Help & Settings</div>
          <Link to="/orders" className="side-menu-item" onClick={onClose}>Your Orders</Link>
          <Link to="/cart" className="side-menu-item" onClick={onClose}>Your Cart</Link>
          {user && <Link to="/admin" className="side-menu-item" onClick={onClose}>Admin Panel</Link>}
          {user && <div className="side-menu-item" onClick={handleLogout}>Sign Out</div>}
        </div>
      </div>
    </>
  )
}

// Bottom Navigation (mobile)
export const BottomNav = () => {
  const { cartCount } = useCart()
  const { user } = useAuth()
  const [path, setPath] = useState(window.location.pathname)

  useEffect(() => {
    const handler = () => setPath(window.location.pathname)
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [])

  const isActive = (p) => path === p || path.startsWith(p + '/') ? 'active' : ''

  return (
    <nav className="bottom-nav">
      <Link to="/" className={`bottom-nav-item ${isActive('/') && !path.startsWith('/products') && !path.startsWith('/cart') && !path.startsWith('/orders') ? 'active' : ''}`}>
        <svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
        Home
      </Link>
      <Link to="/products" className={`bottom-nav-item ${isActive('/products') ? 'active' : ''}`}>
        <svg viewBox="0 0 24 24"><path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"/></svg>
        Categories
      </Link>
      <Link to="/cart" className={`bottom-nav-item ${isActive('/cart') ? 'active' : ''}`}>
        <svg viewBox="0 0 24 24"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1.003 1.003 0 0020 7H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>
        Cart
        {cartCount > 0 && <span className="nav-badge">{cartCount}</span>}
      </Link>
      <Link to={user ? "/orders" : "/login"} className={`bottom-nav-item ${isActive('/orders') ? 'active' : ''}`}>
        <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
        Orders
      </Link>
      <Link to={user ? "/admin" : "/login"} className={`bottom-nav-item ${isActive('/admin') ? 'active' : ''}`}>
        <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
        {user ? 'Account' : 'Sign In'}
      </Link>
    </nav>
  )
}

export default Header
