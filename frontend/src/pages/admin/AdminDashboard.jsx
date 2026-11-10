import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import StatCard from '../../components/common/StatCard'
import ErrorBanner from '../../components/common/ErrorBanner'
import { adminService, errorMessage } from '../../services/api'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    adminService.getStats()
      .then(r => setStats(r.data))
      .catch(err => setError(errorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const actions = [
    { label: 'Review vendor applications', badge: stats?.pendingVendors ? `${stats.pendingVendors} pending` : '', badgeClass: 'bg-orange-100 text-orange-700', link: '/admin/vendors' },
    { label: 'Check recent orders', badge: stats?.pendingOrders ? `${stats.pendingOrders} awaiting vendor` : '', badgeClass: 'bg-blue-100 text-blue-700', link: '/admin/orders' },
    { label: 'Manage user accounts', badge: '', badgeClass: '', link: '/admin/users' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Dashboard</h1>
      <p className="text-gray-500 text-sm mb-6">Overview of your marketplace</p>

      <ErrorBanner message={error} onRetry={load} />

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : stats && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            <StatCard title="Total Users" value={stats.users} icon="👥" color="blue" subtitle="Registered accounts" />
            <StatCard title="Active Vendors" value={stats.vendors} icon="🏪" color="green" subtitle="Approved vendors" />
            <StatCard title="Total Orders" value={stats.orders} icon="📦" color="orange" subtitle="All time" />
            <StatCard title="Sales" value={`$${Number(stats.revenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon="💰" color="purple" subtitle="Excluding cancelled orders" />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 max-w-2xl">
            <h2 className="font-semibold text-gray-800 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              {actions.map(a => (
                <Link key={a.label} to={a.link} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                  <span className="text-sm text-gray-700">{a.label}</span>
                  {a.badge && <span className={`text-xs px-2 py-0.5 rounded-full ${a.badgeClass}`}>{a.badge}</span>}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
