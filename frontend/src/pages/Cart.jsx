import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useEffect, useState } from 'react'
import axios from 'axios'

const Cart = () => {
  const { items, cartTotal, updateQuantity, removeFromCart, isGuest } = useCart()
  const { token } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState({})

  useEffect(() => {
    if (isGuest && items.length > 0) {
      const productIds = [...new Set(items.map(i => parseInt(i.productId)))]
      Promise.all(productIds.map(id => axios.get(`/api/products/${id}`).then(r => ({ id: parseInt(id), data: r.data }))))
        .then(results => {
          const map = {}
          results.forEach(r => { map[r.id] = r.data })
          setProducts(map)
        })
        .catch(console.error)
    }
  }, [items, isGuest])

  if (items.length === 0) return (
    <div className="cart-page">
      <h1>Shopping Cart</h1>
      <div className="empty-state">
        <h2>Your cart is empty</h2>
        <Link to="/" className="btn btn-primary">Continue Shopping</Link>
      </div>
    </div>
  )

  if (!token) return (
    <div className="cart-page">
      <h1>Shopping Cart ({items.reduce((s, i) => s + (i.quantity || 1), 0)} items)</h1>
      {items.map(item => {
        const pid = parseInt(item.productId)
        const product = products[pid] || {}
        const price = product.price || 0
        return (
          <div key={item.tempId || `${pid}-${item.variantId || ''}`} className="cart-item-mobile">
            <Link to={`/product/${pid}`}>
              <img src={product.image} alt={product.name} />
            </Link>
            <div className="cart-item-info">
              <Link to={`/product/${pid}`}><h3>{product.name || 'Loading...'}</h3></Link>
              <div className="stock">In Stock</div>
              <div className="price">&#8377;{(price * (item.quantity || 1)).toLocaleString()}</div>
              <div className="cart-item-qty">
                <button onClick={() => {
                  if ((item.quantity || 1) === 1) removeFromCart(pid, item.variantId)
                  else updateQuantity(pid, (item.quantity || 1) - 1, item.variantId)
                }}>-</button>
                <span>Qty: {item.quantity || 1}</span>
                <button onClick={() => updateQuantity(pid, (item.quantity || 1) + 1, item.variantId)}>+</button>
              </div>
              <div className="cart-item-actions">
                <button onClick={() => removeFromCart(pid, item.variantId)}>Delete</button>
              </div>
            </div>
          </div>
        )
      })}
      <div className="cart-summary-mobile">
        <div className="subtotal">Subtotal ({items.reduce((s, i) => s + (i.quantity || 1), 0)} items): &#8377;{cartTotal.toLocaleString()}</div>
        <button className="btn-proceed" onClick={() => navigate('/login')}>Sign in to Checkout</button>
      </div>
    </div>
  )

  const subtotal = items.reduce((sum, item) => {
    const price = item.variant_price || item.price || 0
    return sum + (price * (item.quantity || 1))
  }, 0)

  return (
    <div className="cart-page">
      <h1>Shopping Cart ({items.reduce((s, i) => s + (i.quantity || 1), 0)} items)</h1>

      {items.map(item => {
        const price = item.variant_price || item.price || 0
        const productId = item.product_id || item.productId
        const variantId = item.variant_id || item.variantId
        return (
          <div key={`${productId}-${variantId || ''}`} className="cart-item-mobile">
            <Link to={`/product/${productId}`}>
              <img src={item.image} alt={item.name} />
            </Link>
            <div className="cart-item-info">
              <Link to={`/product/${productId}`}><h3>{item.name}</h3></Link>
              {item.variant_name && <div style={{fontSize:11,color:'#565959',marginBottom:2}}>{item.variant_name}</div>}
              <div className="stock">In Stock</div>
              <div className="price">&#8377;{(price * (item.quantity || 1)).toLocaleString()}</div>
              <div className="cart-item-qty">
                <button onClick={() => {
                  if ((item.quantity || 1) === 1) removeFromCart(productId, variantId)
                  else updateQuantity(productId, (item.quantity || 1) - 1, variantId)
                }}>-</button>
                <span>Qty: {item.quantity || 1}</span>
                <button onClick={() => updateQuantity(productId, (item.quantity || 1) + 1, variantId)}>+</button>
              </div>
              <div className="cart-item-actions">
                <button onClick={() => removeFromCart(productId, variantId)}>Delete</button>
                <button>Save for later</button>
              </div>
            </div>
          </div>
        )
      })}

      <div className="cart-summary-mobile">
        <div className="subtotal">Subtotal ({items.reduce((s, i) => s + (i.quantity || 1), 0)} items): &#8377;{subtotal.toLocaleString()}</div>
        <button className="btn-proceed" onClick={() => navigate('/checkout')}>Proceed to Buy</button>
      </div>
    </div>
  )
}

export default Cart
