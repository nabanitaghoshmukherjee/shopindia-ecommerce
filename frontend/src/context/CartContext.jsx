import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from './AuthContext'

const CartContext = createContext()

export const useCart = () => useContext(CartContext)

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([])
  const [toast, setToast] = useState(null)
  const { token } = useAuth()

  useEffect(() => {
    if (token) {
      fetchCart()
    } else {
      setItems([])
    }
  }, [token])

  const fetchCart = async () => {
    try {
      const res = await axios.get('/api/cart')
      setItems(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const addToCart = async (productId, quantity = 1, variantId = null) => {
    if (!token) return showToast('Please login to add items to cart')
    try {
      await axios.post('/api/cart/add', { productId, quantity, variantId })
      await fetchCart()
      showToast('Added to cart!')
    } catch (err) {
      showToast('Failed to add to cart')
    }
  }

  const updateQuantity = async (productId, quantity, variantId = null) => {
    try {
      await axios.put('/api/cart/update', { productId, quantity, variantId })
      await fetchCart()
    } catch (err) {
      console.error(err)
    }
  }

  const removeFromCart = async (productId, variantId = null) => {
    try {
      const endpoint = variantId ? `/api/cart/remove/${productId}/${variantId}` : `/api/cart/remove/${productId}`
      await axios.delete(endpoint)
      await fetchCart()
      showToast('Removed from cart')
    } catch (err) {
      console.error(err)
    }
  }

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  const cartTotal = items.reduce((sum, item) => {
    const price = item.variant?.price || item.product?.price || 0
    return sum + (price * (item.quantity || 1))
  }, 0)
  const cartCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0)

  return (
    <CartContext.Provider value={{ items, cartTotal, cartCount, addToCart, updateQuantity, removeFromCart, showToast }}>
      {children}
      {toast && <div className="toast">{toast}</div>}
    </CartContext.Provider>
  )
}
