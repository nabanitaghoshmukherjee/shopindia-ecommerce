import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const Checkout = () => {
  const { items, cartTotal } = useCart()
  const { token } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [razorpayKey, setRazorpayKey] = useState('')
  const [isDemoMode, setIsDemoMode] = useState(true)
  const [address, setAddress] = useState({
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: ''
  })

  useEffect(() => {
    if (!token || items.length === 0) {
      navigate('/cart')
    }
    fetchConfig()
  }, [token, items, navigate])

  const fetchConfig = async () => {
    try {
      const res = await axios.get('/api/config')
      setRazorpayKey(res.data.keyId)
      setIsDemoMode(res.data.keyId === 'rzp_test_XXXXXXXXXX')
    } catch (err) {
      console.error(err)
    }
  }

  const handleInputChange = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value })
  }

  const handleDemoPayment = async () => {
    setLoading(true)
    try {
      await axios.post('/api/payments/create-order', { amount: cartTotal })
      const verifyRes = await axios.post('/api/payments/verify', {})
      
      if (verifyRes.data.success) {
        const newOrder = await axios.post('/api/orders', {
          items,
          address,
          paymentId: verifyRes.data.paymentId
        })
        navigate(`/order-success/${newOrder.data.id}`)
      }
    } catch (err) {
      console.error(err)
      alert('Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true)
        return
      }
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handleRazorpayPayment = async () => {
    setLoading(true)

    try {
      const razorpayLoaded = await loadRazorpay()
      if (!razorpayLoaded) {
        alert('Failed to load Razorpay. Please try again.')
        setLoading(false)
        return
      }

      const orderRes = await axios.post('/api/payments/create-order', { amount: cartTotal })
      const razorpayOrder = orderRes.data

      const options = {
        key: razorpayKey,
        amount: razorpayOrder.amount,
        currency: 'INR',
        name: 'ShopIndia',
        description: 'Order Payment',
        order_id: razorpayOrder.id,
        handler: async (response) => {
          try {
            const verifyRes = await axios.post('/api/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })

            if (verifyRes.data.success) {
              const newOrder = await axios.post('/api/orders', {
                items,
                address,
                paymentId: response.razorpay_payment_id
              })
              navigate(`/order-success/${newOrder.data.id}`)
            }
          } catch (err) {
            alert('Payment verification failed')
          }
        },
        theme: {
          color: '#FF9900'
        }
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (response) => {
        alert('Payment failed: ' + response.error.description)
        setLoading(false)
      })
      rzp.open()
    } catch (err) {
      console.error(err)
      alert('Payment failed. Please try again.')
      setLoading(false)
    }
  }

  const handlePayment = () => {
    if (!address.name || !address.phone || !address.street || !address.city || !address.state || !address.pincode) {
      alert('Please fill in all address fields')
      return
    }

    if (isDemoMode) {
      handleDemoPayment()
    } else {
      handleRazorpayPayment()
    }
  }

  if (!token || items.length === 0) {
    return null
  }

  return (
    <div className="checkout-page">
      <h1>Checkout</h1>

      {isDemoMode && (
        <div style={{ background: '#FFF3CD', padding: '15px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
          <strong>Demo Mode:</strong> Click "Pay Now" to simulate payment without real Razorpay
        </div>
      )}

      <div className="checkout-content">
        <div className="checkout-form">
          <h2>Delivery Address</h2>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" name="name" value={address.name} onChange={handleInputChange} placeholder="Enter your full name" />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input type="tel" name="phone" value={address.phone} onChange={handleInputChange} placeholder="10-digit mobile number" />
          </div>
          <div className="form-group">
            <label>Street Address</label>
            <textarea name="street" value={address.street} onChange={handleInputChange} placeholder="Flat, House no., Building, Street" />
          </div>
          <div className="form-group">
            <label>City</label>
            <input type="text" name="city" value={address.city} onChange={handleInputChange} placeholder="City" />
          </div>
          <div className="form-group">
            <label>State</label>
            <input type="text" name="state" value={address.state} onChange={handleInputChange} placeholder="State" />
          </div>
          <div className="form-group">
            <label>PIN Code</label>
            <input type="text" name="pincode" value={address.pincode} onChange={handleInputChange} placeholder="6-digit PIN code" />
          </div>
        </div>

        <div className="order-summary">
          <h2>Order Summary</h2>
          
          {items.map((item) => (
            <div key={item.productId} className="order-item">
              <img src={item.product.image} alt={item.product.name} />
              <div className="order-item-info">
                <h4>{item.product.name}</h4>
                <p>Qty: {item.quantity}</p>
                <p>₹{(item.product.price * item.quantity).toLocaleString()}</p>
              </div>
            </div>
          ))}

          <div className="order-summary-totals">
            <div>
              <span>Subtotal</span>
              <span>₹{cartTotal.toLocaleString()}</span>
            </div>
            <div>
              <span>Delivery</span>
              <span>Free</span>
            </div>
            <div>
              <span>Tax</span>
              <span>₹0</span>
            </div>
            <div className="total">
              <span>Total</span>
              <span>₹{cartTotal.toLocaleString()}</span>
            </div>
          </div>

          <button className="place-order-btn" onClick={handlePayment} disabled={loading}>
            {loading ? 'Processing...' : `Pay ₹${cartTotal.toLocaleString()} ${isDemoMode ? '(Demo)' : 'with Razorpay'}`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Checkout
