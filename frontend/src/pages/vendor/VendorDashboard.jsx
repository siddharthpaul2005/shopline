import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import StatCard from '../../components/common/StatCard'
import ErrorBanner from '../../components/common/ErrorBanner'
import { vendorService, errorMessage } from '../../services/api'

const APPROVAL = {
  approved: { label: 'Approved', className: 'bg-green-100 text-green-700' },
  pending: { label: 'Pending review', className: 'bg-yellow-100 text-yellow-700' },
  rejected: { label: 'Not approved', className: 'bg-red-100 text-red-700' },
}

export default function VendorDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    vendorService.getStats()
      .then(r => setStats(r.data))
      .catch(err => setError(errorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!stats) return <ErrorBanner message={error} onRetry={load} />

  const approval = APPROVAL[stats.vendorStatus] || APPROVAL.pending
  const steps = [
    { step: '1', label: 'Set up your shop profile', link: '/vendor/shop', done: stats.hasShop },
    { step: '2', label: 'Add your products', link: '/vendor/products', done: stats.products > 0 },
    { step: '3', label: 'Get approved by the ShopLine team', link: '/vendor', done: stats.vendorStatus === 'approved' },
    { step: '4', label: 'Start fulfilling orders', link: '/vendor/orders', done: stats.orders > 0 },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">{stats.shopName || 'Vendor Dashboard'}</h1>
      <p className="text-gray-500 text-sm mb-6">Manage your shop and track performance</p>

      {stats.vendorStatus === 'pending' && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-lg">
          Your account is waiting for approval. You can set up your shop and products now; customers will see them once an admin approves you.
        </div>
      )}
      {stats.vendorStatus === 'rejected' && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          Your vendor account isn't approved, so your shop is hidden from customers. Contact support if you think this is a mistake.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard title="My Products" value={stats.products} icon="🥦" color="green" />
        <StatCard title="Total Orders" value={stats.orders} icon="📦" color="blue" />
        <StatCard title="Sales" value={`$${Number(stats.revenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon="💰" color="purple" />
        <StatCard title="Pending Orders" value={stats.pendingOrders} icon="⏳" color="orange" subtitle={stats.pendingOrders ? 'Need attention' : 'All caught up'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Getting Started</h2>
          <div className="space-y-3">
            {steps.map(s => (
              <Link key={s.step} to={s.link} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${
                  s.done ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700'
                }`}>{s.done ? '✓' : s.step}</span>
                <span className={`text-sm ${s.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{s.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Shop Status</h2>
          <div className="space-y-3">
            {[
              ['Shop', stats.hasShop
                ? <span key="s" className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Set up</span>
                : <span key="s" className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">Not set up</span>],
              ['Approval', <span key="a" className={`text-xs px-2 py-0.5 rounded-full ${approval.className}`}>{approval.label}</span>],
              ['Visible to customers', stats.hasShop && stats.vendorStatus === 'approved' ? 'Yes' : 'No'],
              ['Products listed', stats.products],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-gray-500">{k}</span>
                <span className="font-medium text-gray-700">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
