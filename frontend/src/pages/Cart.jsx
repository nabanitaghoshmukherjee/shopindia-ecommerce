import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

const Cart = () => {
  const { items, cartTotal, updateQuantity, removeFromCart } = useCart()
  const { token } = useAuth()

  if (!token) {
    return (
      <div className="cart-page">
        <h1>Shopping Cart</h1>
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
          </svg>
          <h2>Please sign in to view your cart</h2>
          <p>Sign in to see your saved items</p>
          <Link to="/login" className="btn btn-primary">Sign in</Link>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <h1>Shopping Cart</h1>
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
          </svg>
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added anything yet</p>
          <Link to="/" className="btn btn-primary">Continue Shopping</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <h1>Shopping Cart ({items.length} items)</h1>
      
      <div className="cart-content">
        <div className="cart-items">
          {items.map((item) => (
            <div key={item.productId} className="cart-item">
              <img src={item.product.image} alt={item.product.name} />
              
              <div className="cart-item-info">
                <h3>{item.product.name}</h3>
                <div className="price">₹{item.product.price.toLocaleString()}</div>
                
                <div className="quantity-controls">
                  <button onClick={() => {
                    if (item.quantity === 1) removeFromCart(item.productId)
                    else updateQuantity(item.productId, item.quantity - 1)
                  }}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, item.quantity + 1)}>+</button>
                </div>
              </div>

              <div className="cart-item-actions">
                <button onClick={() => removeFromCart(item.productId)}>Delete</button>
              </div>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <h3>Order Summary</h3>
          <div className="subtotal">
            <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
            <span>₹{cartTotal.toLocaleString()}</span>
          </div>
          <Link to="/checkout" className="checkout-btn">Proceed to Checkout</Link>
        </div>
      </div>
    </div>
  )
}

export default Cart
