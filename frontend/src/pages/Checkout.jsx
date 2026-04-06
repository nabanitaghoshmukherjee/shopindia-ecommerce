import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const Checkout = () => {
  const { items, cartTotal } = useCart()
  const { token, user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [address, setAddress] = useState({ name: user?.name || '', phone: '', street: '', city: '', state: '', pincode: '' })

  useEffect(() => {
    if (!token || items.length === 0) navigate('/cart')
  }, [token, items, navigate])

  const handleInput = (e) => setAddress({ ...address, [e.target.name]: e.target.value })

  const handlePlaceOrder = async () => {
    setLoading(true)
    try {
      await axios.post('/api/payments/create-order', { amount: cartTotal })
      const verifyRes = await axios.post('/api/payments/verify', {})
      if (verifyRes.data.success) {
        const newOrder = await axios.post('/api/orders', { items, address, paymentId: verifyRes.data.paymentId })
        navigate(`/order-success/${newOrder.data.id}`)
      }
    } catch (err) { alert('Payment failed. Please try again.') }
    finally { setLoading(false) }
  }

  const subtotal = cartTotal
  const shipping = subtotal >= 500 ? 0 : 50
  const tax = Math.round(subtotal * 0.18)
  const total = subtotal + shipping + tax

  return (
    <div className="checkout-page">
      <h1>Checkout</h1>

      <div className="checkout-steps-mobile">
        <div className={`checkout-step-mobile ${step >= 1 ? 'active' : ''}`}>1. Address</div>
        <div className={`checkout-step-mobile ${step >= 2 ? 'active' : ''}`}>2. Payment</div>
        <div className={`checkout-step-mobile ${step >= 3 ? 'active' : ''}`}>3. Review</div>
      </div>

      {step === 1 && (
        <div className="checkout-section-mobile">
          <h2>Shipping Address</h2>
          <div className="form-group"><label>Full Name</label><input name="name" value={address.name} onChange={handleInput} required /></div>
          <div className="form-group"><label>Phone</label><input name="phone" value={address.phone} onChange={handleInput} placeholder="10-digit mobile" required /></div>
          <div className="form-group"><label>Address</label><input name="street" value={address.street} onChange={handleInput} placeholder="House no., Street" required /></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            <div className="form-group"><label>City</label><input name="city" value={address.city} onChange={handleInput} required /></div>
            <div className="form-group"><label>State</label><input name="state" value={address.state} onChange={handleInput} required /></div>
          </div>
          <div className="form-group"><label>Pincode</label><input name="pincode" value={address.pincode} onChange={handleInput} placeholder="6-digit" required /></div>
          <button className="btn-place-order" onClick={() => setStep(2)}>Continue</button>
        </div>
      )}

      {step === 2 && (
        <div className="checkout-section-mobile">
          <h2>Payment Method</h2>
          <div className="payment-option"><input type="radio" name="pay" defaultChecked /><div><div className="po-title">Cash on Delivery</div><div className="po-desc">Pay when you receive</div></div></div>
          <div className="payment-option"><input type="radio" name="pay" /><div><div className="po-title">Credit / Debit Card</div><div className="po-desc">Visa, Mastercard, RuPay</div></div></div>
          <div className="payment-option"><input type="radio" name="pay" /><div><div className="po-title">UPI</div><div className="po-desc">Google Pay, PhonePe, Paytm</div></div></div>
          <div style={{display:'flex',gap:8}}>
            <button className="btn-place-order" style={{background:'#f0f2f2',borderColor:'#d5d9d9'}} onClick={() => setStep(1)}>Back</button>
            <button className="btn-place-order" onClick={() => setStep(3)}>Continue</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <>
          <div className="checkout-section-mobile">
            <h2>Order Summary</h2>
            {items.map(item => {
              const price = item.variant?.price || item.product?.price || 0
              return (
                <div key={item.productId} style={{display:'flex',gap:10,padding:'8px 0',borderBottom:'1px solid #f0f0f0'}}>
                  <img src={item.product?.image} alt="" style={{width:50,height:50,objectFit:'contain'}} />
                  <div style={{flex:1}}>
                    <div style={{fontSize:12}}>{item.product?.name}</div>
                    <div style={{fontSize:11,color:'#565959'}}>Qty: {item.quantity}</div>
                  </div>
                  <div style={{fontWeight:700,fontSize:13}}>&#8377;{(price * item.quantity).toLocaleString()}</div>
                </div>
              )
            })}
            <div style={{marginTop:12}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:13,padding:'4px 0'}}><span>Items:</span><span>&#8377;{subtotal.toLocaleString()}</span></div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:13,padding:'4px 0'}}><span>Delivery:</span><span style={{color:'#067d62'}}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span></div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:13,padding:'4px 0'}}><span>Tax (GST):</span><span>&#8377;{tax.toLocaleString()}</span></div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:16,fontWeight:700,padding:'8px 0',borderTop:'2px solid #0f1111',marginTop:4}}><span>Total:</span><span>&#8377;{total.toLocaleString()}</span></div>
            </div>
          </div>
          <button className="btn-place-order" onClick={handlePlaceOrder} disabled={loading}>
            {loading ? 'Processing...' : `Place Order - ₹${total.toLocaleString()}`}
          </button>
        </>
      )}
    </div>
  )
}

export default Checkout
