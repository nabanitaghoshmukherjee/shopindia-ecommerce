import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'

const OrderSuccess = () => {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { axios.get(`/api/orders/${id}`).then(r => setOrder(r.data)).finally(() => setLoading(false)) }, [id])

  if (loading) return <div style={{padding:'60px',textAlign:'center'}}>Loading...</div>

  return (
    <div className="success-page">
      <div className="checkmark"><svg viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></div>
      <h1>Order placed, thanks!</h1>
      <p>Confirmation will be sent to your email</p>
      <div className="order-id">Order ID: <strong>#{order?.id}</strong></div>
      <div style={{maxWidth:'100%',textAlign:'left',background:'#fff',padding:12,borderRadius:8,border:'1px solid #d5d9d9',margin:'0 12px'}}>
        {(order?.items||[]).map(item => (
          <div key={item.productId} style={{display:'flex',gap:10,marginBottom:8,paddingBottom:8,borderBottom:'1px solid #f0f0f0'}}>
            <img src={item.product?.image} alt="" style={{width:50,height:50,objectFit:'contain'}} />
            <div><p style={{fontSize:12,fontWeight:500}}>{item.product?.name}</p><p style={{fontSize:11,color:'#565959'}}>Qty: {item.quantity}</p><p style={{fontWeight:700,fontSize:13}}>&#8377;{(item.product?.price * item.quantity).toLocaleString()}</p></div>
          </div>
        ))}
        <div style={{textAlign:'right'}}><p style={{fontSize:15,fontWeight:700}}>Total: &#8377;{order?.totalAmount.toLocaleString()}</p></div>
      </div>
      <div style={{marginTop:20,display:'flex',gap:10,justifyContent:'center'}}>
        <Link to="/orders" className="btn btn-primary">View Orders</Link>
        <Link to="/" className="btn btn-outline">Continue Shopping</Link>
      </div>
    </div>
  )
}

export default OrderSuccess
