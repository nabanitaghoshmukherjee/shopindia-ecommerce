import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchProfile()
    } else {
      setLoading(false)
    }
  }, [token])

  const fetchProfile = async () => {
    try {
      const res = await axios.get('/api/auth/profile')
      setUser(res.data)
    } catch (err) {
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password, mergeCart) => {
    const res = await axios.post('/api/auth/login', { email, password })
    const { token, user } = res.data
    localStorage.setItem('token', token)
    setToken(token)
    setUser(user)
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    if (mergeCart) mergeCart()
  }

  const register = async (name, email, password, phone, mergeCart) => {
    const res = await axios.post('/api/auth/register', { name, email, password, phone })
    const { token, user } = res.data
    localStorage.setItem('token', token)
    setToken(token)
    setUser(user)
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    if (mergeCart) mergeCart()
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    delete axios.defaults.headers.common['Authorization']
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
