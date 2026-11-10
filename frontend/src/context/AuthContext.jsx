import React, { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/api'

const AuthContext = createContext(null)

function readSavedUser() {
  try {
    const token = localStorage.getItem('token')
    const saved = localStorage.getItem('user')
    return token && saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSavedUser)
  const [loading, setLoading] = useState(() => readSavedUser() !== null)

  // On page load, confirm the saved session with the server and pick up any changes
  // (e.g. a vendor being approved). An expired token is handled by the 401 interceptor.
  useEffect(() => {
    if (!localStorage.getItem('token')) return
    authService.me()
      .then(r => saveUser(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const saveUser = (u) => {
    localStorage.setItem('user', JSON.stringify(u))
    setUser(u)
  }

  const startSession = ({ token, user }) => {
    localStorage.setItem('token', token)
    saveUser(user)
    return user
  }

  const login = async (email, password) => {
    const res = await authService.login({ email, password })
    return startSession(res.data)
  }

  const register = async (data) => {
    const res = await authService.register(data)
    return startSession(res.data)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, updateUser: saveUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
