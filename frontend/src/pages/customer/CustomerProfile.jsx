import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import ErrorBanner from '../../components/common/ErrorBanner'
import { customerService, authService, errorMessage } from '../../services/api'

const inputClass = 'w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500'
const EMPTY_PASSWORDS = { currentPassword: '', newPassword: '', confirmPassword: '' }

export default function CustomerProfile() {
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const [passwords, setPasswords] = useState(EMPTY_PASSWORDS)
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)

  useEffect(() => {
    customerService.getProfile()
      .then(r => setForm({ name: r.data.name, email: r.data.email, phone: r.data.phone || '', address: r.data.address || '' }))
      .catch(err => {
        setForm({ name: user?.name || '', email: user?.email || '', phone: '', address: '' })
        setError(errorMessage(err, "Couldn't load your profile."))
      })
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSuccess('')
    setError('')
    try {
      const res = await customerService.updateProfile(form)
      updateUser(res.data)
      setSuccess('Profile updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPwError('')
    setPwSuccess(false)
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPwError("New passwords don't match")
      return
    }
    setPwSaving(true)
    try {
      await authService.changePassword({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword })
      setPasswords(EMPTY_PASSWORDS)
      setPwSuccess(true)
    } catch (err) {
      setPwError(errorMessage(err))
    } finally {
      setPwSaving(false)
    }
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
          <p className="font-semibold text-gray-800">{user?.name}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <span className="inline-block mt-1 text-xs px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-full">Customer</span>
        </div>
      </div>

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">✅ {success}</div>
      )}
      <ErrorBanner message={error} />

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Personal Information</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input name="name" required maxLength={100} value={form.name} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input name="email" type="email" required value={form.email} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input name="phone" maxLength={30} value={form.phone} onChange={handleChange} className={inputClass} placeholder="+1 234 567 8900" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
            <textarea
              name="address" maxLength={300} value={form.address} onChange={handleChange} rows={2}
              className={`${inputClass} resize-none`}
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
        {pwSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">✅ Password changed.</div>
        )}
        <ErrorBanner message={pwError} />
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input
              type="password" required autoComplete="current-password" value={passwords.currentPassword}
              onChange={e => setPasswords(p => ({ ...p, currentPassword: e.target.value }))}
              className={inputClass} placeholder="••••••••"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password" required minLength={6} autoComplete="new-password" value={passwords.newPassword}
                onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))}
                className={inputClass} placeholder="Min. 6 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password" required minLength={6} autoComplete="new-password" value={passwords.confirmPassword}
                onChange={e => setPasswords(p => ({ ...p, confirmPassword: e.target.value }))}
                className={inputClass} placeholder="••••••••"
              />
            </div>
          </div>
          <button
            type="submit" disabled={pwSaving}
            className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            {pwSaving ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
