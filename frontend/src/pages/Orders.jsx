import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const Orders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const { token } = useAuth()

  useEffect(() => {
    if (token) axios.get('/api/orders').then(r => setOrders(r.data.reverse())).finally(() => setLoading(false))
  }, [token])

  if (!token) return (
    <div className="orders-page">
      <h1>Your Orders</h1>
      <div className="empty-state"><h2>Please sign in</h2><Link to="/login" className="btn btn-primary">Sign in</Link></div>
    </div>
  )

  if (loading) return <div style={{padding:'40px',textAlign:'center'}}>Loading...</div>
  if (orders.length === 0) return (
    <div className="orders-page">
      <h1>Your Orders</h1>
      <div className="empty-state"><h2>No orders yet</h2><Link to="/" className="btn btn-primary">Start Shopping</Link></div>
    </div>
  )

  const badgeStyle = (s) => {
    const m = {Pending:{bg:'#fff3cd',c:'#856404'},Confirmed:{bg:'#cce5ff',c:'#004085'},Packed:{bg:'#d4edda',c:'#155724'},Shipped:{bg:'#d1ecf1',c:'#0c5460'},Delivered:{bg:'#d4edda',c:'#155724'},Cancelled:{bg:'#f8d7da',c:'#721c24'}}
    const x = m[s] || {bg:'#eee',c:'#333'}
    return <span className="order-status-badge" style={{background:x.bg,color:x.c}}>{s}</span>
  }

  return (
    <div className="orders-page">
      <h1>Your Orders</h1>
      {orders.map(order => (
        <div key={order.id} className="order-card-mobile">
          <div className="order-card-header">
            <div>
              <h3>ORDER #{order.id}</h3>
              <p>{new Date(order.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</p>
            </div>
            {badgeStyle(order.status)}
          </div>
          <div className="order-card-items">
            {(order.items||[]).map(item => (
              <Link key={item.productId} to={`/product/${item.productId}`}><img src={item.product?.image} alt={item.product?.name} /></Link>
            ))}
          </div>
          <div className="order-card-footer">
            <span className="total">&#8377;{order.totalAmount.toLocaleString()}</span>
            <Link to={`/product/${order.items?.[0]?.productId || ''}`}>View details</Link>
          </div>
        </div>
      ))}
    </div>
  )
}

export default Orders
