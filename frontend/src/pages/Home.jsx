import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useCart } from '../context/CartContext'

// Category images from Unsplash
const catImages = {
  'electronics': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=200&q=80',
  'fashion': 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=200&q=80',
  'home-kitchen': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&q=80',
  'beauty': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&q=80',
  'books': 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=200&q=80',
  'sports': 'https://images.unsplash.com/photo-1461896836934-bd45ba8fcf9b?w=200&q=80',
  'toys': 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=200&q=80',
  'grocery': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80',
}

const heroSlides = [
  {
    img: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800&q=80',
    bg: 'linear-gradient(135deg, #232f3e, #37475a)',
    title: 'Great Indian Festival',
    sub: 'Top deals on electronics, fashion & more'
  },
  {
    img: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80',
    bg: 'linear-gradient(135deg, #b12704, #cc0c39)',
    title: 'Up to 80% Off',
    sub: 'Clearance sale on top brands'
  },
  {
    img: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80',
    bg: 'linear-gradient(135deg, #007185, #004f5d)',
    title: 'New Arrivals',
    sub: 'Discover the latest fashion trends'
  },
  {
    img: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=800&q=80',
    bg: 'linear-gradient(135deg, #ff9900, #e88b00)',
    title: 'Electronics Deals',
    sub: 'Smartphones, laptops & more at best prices'
  },
]

const Home = () => {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  const { addToCart } = useCart()

  useEffect(() => {
    Promise.all([axios.get('/api/categories'), axios.get('/api/products')])
      .then(([c, p]) => { setCategories(c.data); setProducts(p.data) })
      .finally(() => setLoading(false))
  }, [])

  const nextSlide = useCallback(() => setCurrentSlide(p => (p + 1) % heroSlides.length), [])
  useEffect(() => { const t = setInterval(nextSlide, 4000); return () => clearInterval(t) }, [nextSlide])

  if (loading) return <div style={{padding:'60px',textAlign:'center'}}>Loading...</div>

  const deals = products.filter(p => p.original_price > p.price).slice(0, 10)

  return (
    <div>
      {/* Hero Carousel */}
      <div className="hero-carousel">
        {heroSlides.map((s, i) => (
          <div key={i} className={`hero-slide ${i === currentSlide ? 'active' : ''}`} style={{background: s.bg}}>
            <img src={s.img} alt={s.title} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',opacity:0.4}} />
            <div className="hero-slide-overlay" />
            <div className="hero-slide-content">
              <h1>{s.title}</h1>
              <p>{s.sub}</p>
            </div>
          </div>
        ))}
        <div className="hero-dots">
          {heroSlides.map((_, i) => <div key={i} className={`hero-dot ${i === currentSlide ? 'active' : ''}`} />)}
        </div>
      </div>

      {/* Category Pills */}
      <div className="category-pills-row">
        {categories.map(c => (
          <Link key={c.id} to={`/products/${c.slug}`} className="category-pill">
            <img className="category-pill-img" src={catImages[c.slug] || c.image} alt={c.name} />
            <span className="category-pill-label">{c.name}</span>
          </Link>
        ))}
      </div>

      {/* Deals Section */}
      {deals.length > 0 && (
        <>
          <div className="section-header">
            <h2>Today's Deals</h2>
            <Link to="/products">See all</Link>
          </div>
          <div className="deals-scroll">
            {deals.map(p => {
              const disc = Math.round(((p.original_price - p.price) / p.original_price) * 100)
              return (
                <Link key={p.id} to={`/product/${p.id}`} className="deal-card">
                  <img className="deal-card-img" src={p.image} alt={p.name} />
                  <div className="deal-card-info">
                    <span className="deal-card-discount">{disc}% off</span>
                    <div className="deal-card-title">{p.name}</div>
                    <div className="deal-card-price"><sup>&#8377;</sup>{p.price?.toLocaleString()}</div>
                    <div className="deal-card-original">M.R.P.: &#8377;{p.original_price?.toLocaleString()}</div>
                  </div>
                </Link>
              )
            })}
          </div>
        </>
      )}

      {/* Banner */}
      <div className="banner-card">
        <h3>Free Delivery on First Order</h3>
        <p>Sign up today and get free shipping</p>
        <Link to="/register">Sign Up Now</Link>
      </div>

      {/* Product Sections */}
      {[
        { title: 'Best Sellers', items: products.slice(0, 10) },
        { title: 'Electronics', items: products.filter(p => p.category === 'electronics').slice(0, 10) },
        { title: 'Fashion', items: products.filter(p => p.category === 'fashion').slice(0, 10) },
      ].map((sec, i) => sec.items.length > 0 && (
        <div key={i}>
          <div className="section-header">
            <h2>{sec.title}</h2>
            <Link to="/products">See all</Link>
          </div>
          <div className="product-grid">
            {sec.items.map(p => <ProductCard key={p.id} product={p} addToCart={addToCart} />)}
          </div>
        </div>
      ))}
    </div>
  )
}

const ProductCard = ({ product, addToCart }) => {
  const disc = product.original_price > product.price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100) : 0
  const rating = parseFloat(product.rating) || 4
  const reviews = parseInt(product.reviews) || 0

  return (
    <div className="product-grid-card">
      <Link to={`/product/${product.id}`}>
        <div className="product-grid-card-img-wrap"><img src={product.image} alt={product.name} /></div>
        <div className="product-grid-card-body">
          <h3>{product.name}</h3>
          <div className="rating">
            <span className="rating-badge">{rating} &#9733;</span>
            <span className="rating-count">({reviews.toLocaleString()})</span>
          </div>
          <div>
            <span className="price"><sup>&#8377;</sup>{product.price?.toLocaleString()}</span>
            {disc > 0 && (
              <>
                <span className="original">&#8377;{product.original_price?.toLocaleString()}</span>
                <span className="discount">({disc}%)</span>
              </>
            )}
          </div>
          <div className="delivery"><b>FREE Delivery</b></div>
          {product.badge && <span className="prime-tag">{product.badge}</span>}
        </div>
      </Link>
      <button className="add-cart-btn" onClick={(e) => { e.preventDefault(); addToCart(product.id) }}>Add to Cart</button>
    </div>
  )
}

export default Home
