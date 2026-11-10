import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { errorMessage } from '../../services/api'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      if (user.role === 'admin') navigate('/admin')
      else if (user.role === 'vendor') navigate('/vendor')
      else navigate('/')
    } catch (err) {
      setError(errorMessage(err, 'Login failed. Please check your credentials.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-green-600 flex-col justify-center px-16">
        <div className="text-white">
          <p className="font-display text-5xl mb-4">ShopLine</p>
          <p className="text-green-100 text-xl font-light">Your neighborhood grocery marketplace</p>
          <div className="mt-12 space-y-4">
            {['🛒 Shop from local vendors', '🚀 Fast delivery', '🌿 Fresh produce daily'].map(t => (
              <p key={t} className="text-green-100 text-sm">{t}</p>
            ))}
          </div>
        </div>
      </div>
      {/* Right panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <span className="font-display text-3xl text-green-600">ShopLine</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome back</h1>
          <p className="text-gray-500 mb-8">Sign in to your account</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                name="email" type="email" required value={form.email} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                name="password" type="password" required value={form.password} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-green-600 font-medium hover:text-green-700">Create one</Link>
          </p>

          {/* Demo accounts — only shown when VITE_DEMO_MODE=true (needs SEED_DEMO_DATA=true on the backend) */}
          {import.meta.env.VITE_DEMO_MODE === 'true' && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs font-medium text-gray-500 mb-2">Demo accounts (click to fill)</p>
              <div className="space-y-1 text-xs">
                {[
                  ['Customer', 'customer@shopline.test'],
                  ['Vendor', 'vendor@shopline.test'],
                ].map(([label, email]) => (
                  <button
                    key={email} type="button"
                    onClick={() => setForm({ email, password: 'demo1234' })}
                    className="block text-gray-500 hover:text-green-700"
                  >
                    {label}: {email} / demo1234
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
