import { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import axios from 'axios'
import { useCart } from '../context/CartContext'

const Products = () => {
  const { category } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('')
  const { addToCart } = useCart()

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (category) params.append('category', category)
        if (searchParams.get('search')) params.append('search', searchParams.get('search'))
        if (sort) params.append('sort', sort)

        const res = await axios.get(`/api/products?${params}`)
        setProducts(res.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [category, searchParams, sort])

  const categoryTitle = category 
    ? category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : 'All Products'

  return (
    <div className="products-page">
      <div className="page-header">
        <div className="breadcrumb">
          <Link to="/">Home</Link> &gt; <span>{categoryTitle}</span>
        </div>
        <h1>{categoryTitle} ({products.length} products)</h1>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <select 
          value={sort} 
          onChange={(e) => setSort(e.target.value)}
          style={{ padding: '10px', borderRadius: '8px', border: '1px solid #DDD' }}
        >
          <option value="">Sort by</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="rating">Highest Rated</option>
        </select>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
          </svg>
          <h2>No products found</h2>
          <p>Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} addToCart={addToCart} />
          ))}
        </div>
      )}
    </div>
  )
}

const ProductCard = ({ product, addToCart }) => {
  const discount = product.originalPrice > 0 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
    : 0

  const handleAddToCart = (e) => {
    e.preventDefault()
    addToCart(product.id)
  }

  return (
    <div className="product-card">
      {product.badge && <span className="badge">{product.badge}</span>}
      <Link to={`/product/${product.id}`}>
        <img src={product.image} alt={product.name} className="image" />
      </Link>
      <Link to={`/product/${product.id}`}>
        <h3>{product.name}</h3>
      </Link>
      <div className="rating">
        <span className="stars">{'★'.repeat(Math.floor(product.rating))}</span>
        <span className="reviews">{product.reviews.toLocaleString()}</span>
      </div>
      <div className="price">
        <span className="current">₹{product.price.toLocaleString()}</span>
        <span className="original">₹{product.originalPrice.toLocaleString()}</span>
        <span className="discount">{discount}% off</span>
      </div>
      <button className="btn btn-primary" onClick={handleAddToCart} style={{ width: '100%', marginTop: '10px' }}>
        Add to Cart
      </button>
    </div>
  )
}

export default Products
