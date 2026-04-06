import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { useCart } from '../context/CartContext'

const ProductDetail = () => {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [loading, setLoading] = useState(true)
  const { addToCart } = useCart()

  useEffect(() => {
    axios.get(`/api/products/${id}`)
      .then(r => {
        setProduct(r.data)
        if (r.data.variants?.length > 0) setSelectedVariant(r.data.variants[0])
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleAddToCart = () => {
    addToCart(product.id, quantity, selectedVariant?.id)
  }

  const handleBuyNow = () => {
    addToCart(product.id, quantity, selectedVariant?.id)
    setTimeout(() => window.location.href = '/checkout', 500)
  }

  if (loading) return <div style={{padding:'60px',textAlign:'center'}}>Loading...</div>
  if (!product) return <div style={{padding:'60px',textAlign:'center'}}>Product not found</div>

  const displayPrice = selectedVariant ? selectedVariant.price : product.price
  const disc = product.originalPrice > displayPrice
    ? Math.round(((product.originalPrice - displayPrice) / product.originalPrice) * 100) : 0
  const inStock = product.inStock && (!selectedVariant || (selectedVariant.stock > 0))
  const rating = product.rating || 4
  const reviews = product.reviews || 0

  const allImages = [
    product.image,
    ...(product.variants || []).map(v => v.image).filter(Boolean)
  ].filter((v, i, a) => a.indexOf(v) === i)

  return (
    <div className="product-detail-mobile">
      {/* Image */}
      <div className="product-image-carousel">
        <img src={selectedVariant?.image || product.image} alt={product.name} />
        {allImages.length > 1 && (
          <div className="image-counter">1 / {allImages.length}</div>
        )}
      </div>

      {/* Info */}
      <div className="product-info-mobile">
        <h1>{product.name}</h1>
        {product.brand && <Link to="#" className="brand-link">Visit the {product.brand} Store</Link>}

        <div className="rating-row">
          <span className="stars">{'\u2605'.repeat(Math.floor(rating))}{'\u2606'.repeat(5 - Math.floor(rating))}</span>
          <span className="rating-badge">{rating}</span>
          <span className="rating-count">{reviews.toLocaleString()} ratings</span>
        </div>

        <div className="price-block">
          <span className="price-label">Deal Price:</span>
          <div>
            <span className="price-main"><sup>&#8377;</sup>{displayPrice?.toLocaleString()}</span>
            {disc > 0 && (
              <>
                <span className="price-original">&#8377;{product.originalPrice?.toLocaleString()}</span>
                <span className="price-discount">-{disc}%</span>
              </>
            )}
          </div>
          <div className="price-inclusive">Inclusive of all taxes</div>
        </div>

        {/* Variants */}
        {product.variants?.length > 0 && (
          <div style={{marginBottom: 16}}>
            <div style={{fontSize:13,fontWeight:700,marginBottom:8}}>
              Select {product.variants[0].name.includes('Size') ? 'Size' : product.variants[0].name.includes('GB') ? 'Storage' : 'Option'}:
            </div>
            <div className="variants">
              {product.variants.map(v => (
                <button key={v.id}
                  className={`variant-btn ${selectedVariant?.id === v.id ? 'active' : ''}`}
                  onClick={() => setSelectedVariant(v)}
                >
                  {v.name}
                  {v.price !== product.price && (
                    <span style={{fontSize:10,color:'#565959',display:'block'}}>
                      &#8377;{v.price.toLocaleString()}
                    </span>
                  )}
                  <span style={{fontSize:10,color: v.stock > 5 ? '#007600' : '#b12704',display:'block'}}>
                    {v.stock > 5 ? 'In Stock' : v.stock > 0 ? `Only ${v.stock} left` : 'Out of Stock'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="delivery-card">
          <div><b>FREE Delivery</b> <span>by {new Date(Date.now() + 86400000 * 2).toLocaleDateString('en-IN', {weekday:'short',day:'numeric',month:'short'})}</span></div>
          <div style={{marginTop:4}}><b>7 Days</b> <span>Replacement Policy</span></div>
        </div>

        <div className="features">
          <h3>About this item</h3>
          <ul>
            {product.description ? product.description.split('.').filter(s => s.trim()).slice(0, 5).map((s, i) => (
              <li key={i}>{s.trim()}.</li>
            )) : <li>Great quality product</li>}
            <li>Free delivery across India</li>
            <li>7-day replacement policy</li>
          </ul>
        </div>
      </div>

      {/* Buy Box */}
      <div className="sticky-buy-bar">
        <div className="stock-info" style={{color: inStock ? '#007600' : '#b12704', fontSize: 14, marginBottom: 8}}>
          {inStock ? '\u2713 In Stock' : 'Currently unavailable'}
        </div>
        <div className="delivery-info">
          <b>FREE Delivery</b> by {new Date(Date.now() + 86400000 * 2).toLocaleDateString('en-IN', {weekday:'short',day:'numeric',month:'short'})}
        </div>
        <select className="qty-select" value={quantity} onChange={e => setQuantity(parseInt(e.target.value))}>
          {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>Qty: {n}</option>)}
        </select>
        <button className="btn-add-cart" onClick={handleAddToCart} disabled={!inStock}>Add to Cart</button>
        <button className="btn-buy-now" onClick={handleBuyNow} disabled={!inStock}>Buy Now</button>
      </div>
    </div>
  )
}

export default ProductDetail
