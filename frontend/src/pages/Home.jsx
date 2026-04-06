import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const Home = () => {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          axios.get('/api/categories'),
          axios.get('/api/products')
        ])
        setCategories(catRes.data)
        setProducts(prodRes.data.slice(0, 8))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>

  return (
    <div>
      <div className="hero">
        <h1>Welcome to ShopIndia</h1>
        <p>Millions of products at your fingertips</p>
      </div>

      <div className="categories">
        {categories.map((cat) => (
          <Link to={`/products/${cat.slug}`} key={cat.id} className="category-card">
            <img src={cat.image} alt={cat.name} />
            <h3>{cat.name}</h3>
          </Link>
        ))}
      </div>

      <section className="products-section">
        <h2 className="section-title">Trending Products</h2>
        <div className="products-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="products-section">
        <h2 className="section-title">Best Sellers in Electronics</h2>
        <div className="products-grid">
          {products.filter(p => p.category === 'electronics').slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  )
}

const ProductCard = ({ product }) => {
  const discount = product.originalPrice > 0 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
    : 0

  return (
    <Link to={`/product/${product.id}`} className="product-card">
      {product.badge && <span className="badge">{product.badge}</span>}
      <img src={product.image} alt={product.name} className="image" />
      <h3>{product.name}</h3>
      <div className="rating">
        <span className="stars">{'★'.repeat(Math.floor(product.rating))}</span>
        <span className="reviews">{product.reviews.toLocaleString()}</span>
      </div>
      <div className="price">
        <span className="current">₹{product.price.toLocaleString()}</span>
        <span className="original">₹{product.originalPrice.toLocaleString()}</span>
        <span className="discount">{discount}% off</span>
      </div>
    </Link>
  )
}

export default Home
