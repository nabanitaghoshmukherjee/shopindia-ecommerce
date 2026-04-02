import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const Orders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const { token } = useAuth()

  useEffect(() => {
    if (token) {
      fetchOrders()
    }
  }, [token])

  const fetchOrders = async () => {
    try {
      const res = await axios.get('/api/orders')
      setOrders(res.data.reverse())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="orders-page">
        <h1>Your Orders</h1>
        <div className="empty-state">
          <h2>Please sign in to view your orders</h2>
          <Link to="/login" className="btn btn-primary">Sign in</Link>
        </div>
      </div>
    )
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>

  if (orders.length === 0) {
    return (
      <div className="orders-page">
        <h1>Your Orders</h1>
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
          </svg>
          <h2>No orders yet</h2>
          <p>When you place orders, they'll appear here</p>
          <Link to="/" className="btn btn-primary">Start Shopping</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="orders-page">
      <h1>Your Orders</h1>

      {orders.map((order) => (
        <div key={order.id} className="order-card">
          <div className="order-header">
            <div>
              <h3>Order #{order.id}</h3>
              <p style={{ fontSize: '13px', color: '#555' }}>
                Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
            </div>
            <span className="status">{order.status}</span>
          </div>

          <div className="order-items">
            {order.items.map((item) => (
              <img key={item.productId} src={item.product.image} alt={item.product.name} />
            ))}
          </div>

          <div className="order-total">
            Total: ₹{order.totalAmount.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  )
}

export default Orders
