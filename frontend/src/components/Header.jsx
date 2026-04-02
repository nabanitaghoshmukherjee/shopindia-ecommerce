import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

const Header = () => {
  const [search, setSearch] = useState('')
  const { user, logout } = useAuth()
  const { cartCount } = useCart()
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) {
      navigate(`/products?search=${encodeURIComponent(search)}`)
    }
  }

  return (
    <header className="header">
      <div className="header-top">
        <Link to="/" className="logo">
          Shop<span>India</span>
        </Link>

        <form className="search-bar" onSubmit={handleSearch}>
          <select>
            <option>All</option>
            <option>Electronics</option>
            <option>Fashion</option>
            <option>Home</option>
            <option>Beauty</option>
          </select>
          <input
            type="text"
            placeholder="Search Amazon.in"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          </button>
        </form>

        <nav className="header-nav">
          {user ? (
            <>
              <Link to="/admin" className="nav-item">
                <span>Hello, {user.name}</span>
                <strong>Admin</strong>
              </Link>
              <Link to="/orders" className="nav-item">
                <span>Returns</span>
                <strong>& Orders</strong>
              </Link>
              <div className="nav-item" onClick={logout} style={{ cursor: 'pointer' }}>
                <span>Sign out</span>
              </div>
            </>
          ) : (
            <Link to="/login" className="nav-item">
              <span>Hello, Sign in</span>
              <strong>Account</strong>
            </Link>
          )}

          <Link to="/cart" className="cart-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
            <span className="cart-badge">{cartCount}</span>
          </Link>
        </nav>
      </div>

      <div className="header-bottom">
        <Link to="/products">All Products</Link>
        <Link to="/products/electronics">Electronics</Link>
        <Link to="/products/fashion">Fashion</Link>
        <Link to="/products/home-kitchen">Home & Kitchen</Link>
        <Link to="/products/beauty">Beauty</Link>
        <Link to="/products/sports">Sports</Link>
        <Link to="/products/books">Books</Link>
      </div>
    </header>
  )
}

export default Header
