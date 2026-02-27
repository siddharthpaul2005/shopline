import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

// ─── Mock users for demo (no backend needed) ───────────────────────────────
const MOCK_USERS = [
  { _id: 'u1', name: 'Super Admin',   email: 'admin@freshmart.com',  password: 'admin123',  role: 'admin'    },
  { _id: 'u2', name: 'Green Vendor',  email: 'vendor@freshmart.com', password: 'vendor123', role: 'vendor'   },
  { _id: 'u3', name: 'Alice Customer',email: 'user@freshmart.com',   password: 'user123',   role: 'customer' },
]

const mockLogin = (email, password) => {
  const found = MOCK_USERS.find(u => u.email === email && u.password === password)
  if (!found) throw new Error('Invalid email or password')
  const { password: _, ...user } = found
  return { token: 'mock-jwt-token-' + user._id, user }
}

const mockRegister = ({ name, email, password, role }) => {
  if (MOCK_USERS.find(u => u.email === email)) throw new Error('Email already registered')
  const user = { _id: 'u' + Date.now(), name, email, role: role || 'customer' }
  MOCK_USERS.push({ ...user, password })
  return { token: 'mock-jwt-token-' + user._id, user }
}
// ───────────────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (token && savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    let token, user
    try {
      const res = await api.post('/api/auth/login', { email, password })
      token = res.data.token
      user  = res.data.user
    } catch {
      // Fallback to mock when backend is unavailable
      const mock = mockLogin(email, password)
      token = mock.token
      user  = mock.user
    }
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setUser(user)
    return user
  }

  const register = async (data) => {
    let token, user
    try {
      const res = await api.post('/api/auth/register', data)
      token = res.data.token
      user  = res.data.user
    } catch {
      const mock = mockRegister(data)
      token = mock.token
      user  = mock.user
    }
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setUser(user)
    return user
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
