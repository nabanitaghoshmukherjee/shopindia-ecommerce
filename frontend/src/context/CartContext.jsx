import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from './AuthContext'

const CartContext = createContext()
const LOCAL_CART_KEY = 'shopindia_guest_cart'

export const useCart = () => useContext(CartContext)

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([])
  const [toast, setToast] = useState(null)
  const { token, user } = useAuth()
  const [isGuest, setIsGuest] = useState(false)

  useEffect(() => {
    if (token) {
      setIsGuest(false)
      fetchCart()
    } else {
      setIsGuest(true)
      loadLocalCart()
    }
  }, [token])

  const loadLocalCart = () => {
    const saved = localStorage.getItem(LOCAL_CART_KEY)
    if (saved) {
      try {
        setItems(JSON.parse(saved))
      } catch {
        setItems([])
      }
    } else {
      setItems([])
    }
  }

  const saveLocalCart = (cartItems) => {
    localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(cartItems))
  }

  const fetchCart = async () => {
    try {
      const res = await axios.get('/api/cart')
      setItems(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const addToCart = async (productId, quantity = 1, variantId = null) => {
    try {
      if (isGuest) {
        const pid = parseInt(productId)
        const vid = variantId ? variantId.toString() : null
        setItems(prev => {
          const existingIndex = prev.findIndex(i => 
            parseInt(i.productId) === pid && 
            (i.variantId ? i.variantId.toString() : null) === vid
          )
          let updated
          if (existingIndex >= 0) {
            updated = prev.map((item, idx) => 
              idx === existingIndex 
                ? { ...item, quantity: (item.quantity || 1) + quantity }
                : item
            )
          } else {
            updated = [...prev, { productId: pid, quantity, variantId: vid, tempId: Date.now() }]
          }
          saveLocalCart(updated)
          return updated
        })
        showToast('Added to cart!')
      } else {
        await axios.post('/api/cart/add', { productId, quantity, variantId })
        await fetchCart()
        showToast('Added to cart!')
      }
    } catch (err) {
      console.error('Add to cart error:', err)
      showToast('Failed to add to cart')
    }
  }

  const updateQuantity = async (productId, quantity, variantId = null) => {
    try {
      if (isGuest) {
        const pid = parseInt(productId)
        const vid = variantId ? variantId.toString() : null
        setItems(prev => {
          const updated = prev.map(i => 
            parseInt(i.productId) === pid && (i.variantId ? i.variantId.toString() : null) === vid
              ? { ...i, quantity }
              : i
          ).filter(i => i.quantity > 0)
          saveLocalCart(updated)
          return updated
        })
      } else {
        await axios.put('/api/cart/update', { productId, quantity, variantId })
        await fetchCart()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const removeFromCart = async (productId, variantId = null) => {
    try {
      if (isGuest) {
        const pid = parseInt(productId)
        const vid = variantId ? variantId.toString() : null
        setItems(prev => {
          const updated = prev.filter(i => 
            !(parseInt(i.productId) === pid && (i.variantId ? i.variantId.toString() : null) === vid)
          )
          saveLocalCart(updated)
          return updated
        })
        showToast('Removed from cart')
      } else {
        const endpoint = variantId ? `/api/cart/remove/${productId}/${variantId}` : `/api/cart/remove/${productId}`
        await axios.delete(endpoint)
        await fetchCart()
        showToast('Removed from cart')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const clearGuestCart = () => {
    localStorage.removeItem(LOCAL_CART_KEY)
    setItems([])
  }

  const mergeGuestCart = async () => {
    const guestCart = JSON.parse(localStorage.getItem(LOCAL_CART_KEY) || '[]')
    for (const item of guestCart) {
      try {
        await axios.post('/api/cart/add', {
          productId: item.productId,
          quantity: item.quantity,
          variantId: item.variantId
        })
      } catch (err) {
        console.error('Failed to merge item:', err)
      }
    }
    clearGuestCart()
    await fetchCart()
  }

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  const cartTotal = items.reduce((sum, item) => {
    const price = item.variant_price || item.price || 0
    return sum + (price * (item.quantity || 1))
  }, 0)
  const cartCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0)

  return (
    <CartContext.Provider value={{ items, cartTotal, cartCount, addToCart, updateQuantity, removeFromCart, showToast, mergeGuestCart, clearGuestCart, isGuest }}>
      {children}
      {toast && <div className="toast">{toast}</div>}
    </CartContext.Provider>
  )
}
