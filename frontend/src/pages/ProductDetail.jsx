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
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`/api/products/${id}`)
        setProduct(res.data)
        if (res.data.variants && res.data.variants.length > 0) {
          setSelectedVariant(res.data.variants[0])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [id])

  const handleAddToCart = () => {
    const variantId = selectedVariant ? selectedVariant.id : null
    addToCart(product.id, quantity, variantId)
  }

  const handleBuyNow = () => {
    const variantId = selectedVariant ? selectedVariant.id : null
    addToCart(product.id, quantity, variantId)
    window.location.href = '/cart'
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
  if (!product) return <div style={{ padding: '40px', textAlign: 'center' }}>Product not found</div>

  const displayPrice = selectedVariant ? selectedVariant.price : product.price
  const discount = product.originalPrice > 0 
    ? Math.round(((product.originalPrice - displayPrice) / product.originalPrice) * 100) 
    : 0
  const hasVariants = product.variants && product.variants.length > 0

  return (
    <div className="product-detail">
      <div className="product-gallery">
        <img src={selectedVariant?.image || product.image} alt={product.name} className="product-main-image" />
        {hasVariants && (
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
            {product.variants.map(v => (
              <img 
                key={v.id} 
                src={v.image || product.image} 
                alt={v.name}
                onClick={() => setSelectedVariant(v)}
                style={{ 
                  width: '60px', 
                  height: '60px', 
                  objectFit: 'cover', 
                  borderRadius: '8px',
                  border: selectedVariant?.id === v.id ? '2px solid #FF9900' : '2px solid #DDD',
                  cursor: 'pointer'
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="product-info">
        <h1>{product.name}</h1>
        
        <div className="rating">
          <span className="stars" style={{ fontSize: '18px', color: '#FF9900' }}>
            {'★'.repeat(Math.floor(product.rating))}
          </span>
          <span style={{ color: '#007185' }}>{product.reviews.toLocaleString()} ratings</span>
        </div>

        <div className="price-section">
          <div className="current-price">
            ₹{displayPrice.toLocaleString()}
            {selectedVariant && selectedVariant.price !== product.price && (
              <span style={{ fontSize: '14px', color: '#666', marginLeft: '10px' }}>
                (Base: ₹{product.price.toLocaleString()})
              </span>
            )}
          </div>
          <div className="price-details">
            <span>M.R.P.: ₹{product.originalPrice.toLocaleString()}</span>
            <span style={{ color: '#007600' }}>{discount}% off</span>
          </div>
        </div>

        {hasVariants && (
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ marginBottom: '10px' }}>Select Variant:</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {product.variants.map(v => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariant(v)}
                  style={{
                    padding: '10px 15px',
                    border: selectedVariant?.id === v.id ? '2px solid #FF9900' : '1px solid #DDD',
                    borderRadius: '8px',
                    background: selectedVariant?.id === v.id ? '#FFF3E0' : 'white',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  <div style={{ fontWeight: '500' }}>{v.name}</div>
                  <div style={{ color: '#007600', fontSize: '12px' }}>₹{v.price.toLocaleString()}</div>
                  <div style={{ color: v.stock > 0 ? '#007600' : '#D62626', fontSize: '11px' }}>
                    {v.stock > 0 ? `${v.stock} in stock` : 'Out of stock'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <p style={{ marginBottom: '15px', color: '#555' }}>{product.description}</p>

        <ul className="features">
          <li>✓ In Stock: {product.inStock ? 'Yes' : 'No'}</li>
          <li>✓ Free delivery available</li>
          <li>✓ 7-day replacement</li>
          <li>✓ 1 Year warranty</li>
        </ul>

        <div className="stock-status" style={{ color: product.inStock ? '#007600' : '#D62626' }}>
          {product.inStock ? '✓ In Stock' : 'Out of Stock'}
        </div>

        <div className="quantity-controls" style={{ marginBottom: '20px' }}>
          <span>Quantity:</span>
          <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
          <span>{quantity}</span>
          <button onClick={() => setQuantity(quantity + 1)}>+</button>
        </div>

        <div className="actions">
          <button className="add-to-cart" onClick={handleAddToCart}>
            Add to Cart
          </button>
          <button className="buy-now" onClick={handleBuyNow}>
            Buy Now
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail
