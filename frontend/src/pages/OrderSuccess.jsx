import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'

const OrderSuccess = () => {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await axios.get(`/api/orders/${id}`)
        setOrder(res.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [id])

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>

  return (
    <div className="success-page">
      <div className="checkmark">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
      </div>
      
      <h1>Order Placed Successfully!</h1>
      <p>Thank you for your order. Your order has been confirmed.</p>
      
      <div className="order-id">
        Order ID: <strong>#{order?.id}</strong>
      </div>

      <div style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'left', background: '#F3F3F3', padding: '20px', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '15px' }}>Order Details</h3>
        
        {order?.items.map((item) => (
          <div key={item.productId} style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
            <img src={item.product.image} alt={item.product.name} style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
            <div>
              <p style={{ fontWeight: '500' }}>{item.product.name}</p>
              <p style={{ color: '#555', fontSize: '14px' }}>Qty: {item.quantity}</p>
              <p style={{ fontWeight: 'bold' }}>₹{(item.product.price * item.quantity).toLocaleString()}</p>
            </div>
          </div>
        ))}

        <div style={{ borderTop: '1px solid #DDD', paddingTop: '15px', marginTop: '15px' }}>
          <p><strong>Total Paid:</strong> ₹{order?.totalAmount.toLocaleString()}</p>
          <p><strong>Status:</strong> {order?.status}</p>
        </div>

        <div style={{ borderTop: '1px solid #DDD', paddingTop: '15px', marginTop: '15px' }}>
          <p><strong>Delivery Address:</strong></p>
          <p>{order?.address.name}</p>
          <p>{order?.address.street}</p>
          <p>{order?.address.city}, {order?.address.state} - {order?.address.pincode}</p>
        </div>
      </div>

      <div style={{ marginTop: '30px', display: 'flex', gap: '15px', justifyContent: 'center' }}>
        <Link to="/orders" className="btn btn-primary">View Orders</Link>
        <Link to="/" className="btn btn-outline">Continue Shopping</Link>
      </div>
    </div>
  )
}

export default OrderSuccess
