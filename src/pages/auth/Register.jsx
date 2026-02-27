import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const roles = [
  { value: 'customer', label: 'Customer', desc: 'Shop from local vendors', icon: '🛒' },
  { value: 'vendor', label: 'Vendor', desc: 'Sell your products', icon: '🏪' },
]

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'customer' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await register(form)
      if (user.role === 'vendor') navigate('/vendor')
      else navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="font-display text-3xl text-green-600">FreshMart</span>
          <h1 className="text-2xl font-bold text-gray-800 mt-4 mb-1">Create your account</h1>
          <p className="text-gray-500 text-sm">Join the marketplace today</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">{error}</div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {/* Role selection */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">I want to</label>
            <div className="grid grid-cols-2 gap-3">
              {roles.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, role: r.value }))}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    form.role === r.value ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-xl mb-1">{r.icon}</div>
                  <div className="text-sm font-medium text-gray-800">{r.label}</div>
                  <div className="text-xs text-gray-500">{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                name="name" required value={form.name} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>
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
                name="password" type="password" required minLength={6} value={form.password} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Min. 6 characters"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-60"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-green-600 font-medium hover:text-green-700">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
