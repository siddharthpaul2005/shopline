import React, { useState, useEffect } from 'react'
import { vendorService, errorMessage } from '../../services/api'

const EMPTY = { name: '', description: '', address: '', phone: '', category: '', image: '' }

// Keep only the editable fields from the server's shop object.
const toForm = (shop) => Object.fromEntries(Object.keys(EMPTY).map(k => [k, shop?.[k] ?? '']))

export default function VendorShop() {
  const [form, setForm] = useState(EMPTY)
  const [saved, setSaved] = useState(null) // the shop as stored on the server, or null if none yet
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    vendorService.getShop()
      .then(r => {
        if (r.data) {
          setSaved(r.data)
          setForm(toForm(r.data))
        }
      })
      .catch(err => setError(errorMessage(err, "Couldn't load your shop.")))
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      const res = saved ? await vendorService.updateShop(form) : await vendorService.createShop(form)
      setSaved(res.data)
      setForm(toForm(res.data))
      setSuccess(true)
    } catch (err) {
      setError(errorMessage(err, 'Failed to save shop. Please try again.'))
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setForm(saved ? toForm(saved) : EMPTY)
    setError('')
    setSuccess(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">My Shop</h1>
      <p className="text-gray-500 text-sm mb-6">Set up your shop profile visible to customers</p>

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">
          ✅ Shop saved successfully!
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name *</label>
              <input
                name="name" required value={form.name} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g. Green Valley Farms"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description" value={form.description} onChange={handleChange} rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                placeholder="Tell customers about your shop..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                name="category" value={form.category} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select category</option>
                {['Organic', 'Fruits & Vegetables', 'Dairy', 'Bakery', 'Meat & Poultry', 'Seafood', 'General Grocery'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                name="phone" value={form.phone} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="+1 234 567 8900"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                name="address" value={form.address} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="123 Main St, City, State"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Shop Banner Image URL</label>
              <input
                name="image" value={form.image} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit" disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving...' : saved ? 'Save Changes' : 'Create Shop'}
            </button>
            <button type="button" onClick={handleReset} className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
