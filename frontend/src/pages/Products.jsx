import { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import axios from 'axios'
import { useCart } from '../context/CartContext'

const Products = () => {
  const { category } = useParams()
  const [searchParams] = useSearchParams()
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
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    fetchProducts()
  }, [category, searchParams, sort])

  const title = searchParams.get('search')
    ? `Results for "${searchParams.get('search')}"`
    : category ? category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'All Products'

  return (
    <div className="products-page">
      <div className="page-header-mobile">
        <div className="breadcrumb"><Link to="/">Home</Link> &gt; <span>{title}</span></div>
        <h1>{title}</h1>
      </div>

      {/* Filter Bar */}
      <div className="products-filter-bar">
        <button className={`filter-chip ${sort === 'price-asc' ? 'active' : ''}`} onClick={() => setSort(sort === 'price-asc' ? '' : 'price-asc')}>
          &#8377; Low to High
        </button>
        <button className={`filter-chip ${sort === 'price-desc' ? 'active' : ''}`} onClick={() => setSort(sort === 'price-desc' ? '' : 'price-desc')}>
          &#8377; High to Low
        </button>
        <button className={`filter-chip ${sort === 'rating' ? 'active' : ''}`} onClick={() => setSort(sort === 'rating' ? '' : 'rating')}>
          &#9733; Rating
        </button>
        <button className={`filter-chip ${sort === 'id' ? 'active' : ''}`} onClick={() => setSort(sort === 'id' ? '' : 'id')}>
          Newest
        </button>
      </div>

      <div className="products-result-info">{products.length} results</div>

      {loading ? (
        <div style={{padding:'40px',textAlign:'center'}}>Loading...</div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <h2>No results found</h2>
          <p>Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="product-grid">
          {products.map(product => {
            const disc = product.original_price > product.price
              ? Math.round(((product.original_price - product.price) / product.original_price) * 100) : 0
            const rating = parseFloat(product.rating) || 4
            const reviews = parseInt(product.reviews) || 0
            return (
              <div key={product.id} className="product-grid-card">
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
                <button className="add-cart-btn" onClick={() => addToCart(product.id)}>Add to Cart</button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Products
