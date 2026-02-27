import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { customerService } from '../../services/api'

export default function CustomerProfile() {
  const { user } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    customerService.getProfile()
      .then(r => setForm(r.data))
      .catch(() => setForm({ name: user?.name || '', email: user?.email || '', phone: '', address: '' }))
      .finally(() => setLoading(false))
  }, [user])

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSuccess(false)
    try {
      await customerService.updateProfile(form)
    } catch {}
    setSuccess(true)
    setSaving(false)
    setTimeout(() => setSuccess(false), 3000)
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 flex justify-center">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">My Profile</h1>
      <p className="text-gray-500 text-sm mb-6">Manage your account details</p>

      {/* Avatar section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 flex items-center gap-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-2xl font-bold text-green-700">
          {form.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div>
          <p className="font-semibold text-gray-800">{form.name}</p>
          <p className="text-sm text-gray-500">{form.email}</p>
          <span className="inline-block mt-1 text-xs px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-full">Customer</span>
        </div>
      </div>

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">
          ✅ Profile updated successfully!
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Personal Information</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                name="name" value={form.name} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                name="email" type="email" value={form.email} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                name="phone" value={form.phone} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="+1 234 567 8900"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
            <textarea
              name="address" value={form.address} onChange={handleChange} rows={2}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              placeholder="Your default delivery address"
            />
          </div>
          <div className="pt-2">
            <button
              type="submit" disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
        <h2 className="font-semibold text-gray-800 mb-4">Change Password</h2>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input type="password" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="••••••••" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input type="password" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="••••••••" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input type="password" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="••••••••" />
            </div>
          </div>
          <button type="button" className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            Update Password
          </button>
        </form>
      </div>
    </div>
  )
}
