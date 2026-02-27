import React, { useState, useEffect } from 'react'
import StatCard from '../../components/common/StatCard'
import { vendorService } from '../../services/api'

const MOCK_STATS = { products: 24, orders: 87, revenue: 3240, pendingOrders: 5 }

export default function VendorDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    vendorService.getStats()
      .then(r => setStats(r.data))
      .catch(() => setStats(MOCK_STATS))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Vendor Dashboard</h1>
      <p className="text-gray-500 text-sm mb-6">Manage your shop and track performance</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard title="My Products" value={stats?.products || 0} icon="🥦" color="green" />
        <StatCard title="Total Orders" value={stats?.orders || 0} icon="📦" color="blue" />
        <StatCard title="Revenue" value={`$${(stats?.revenue || 0).toLocaleString()}`} icon="💰" color="purple" />
        <StatCard title="Pending Orders" value={stats?.pendingOrders || 0} icon="⏳" color="orange" subtitle="Need attention" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Getting Started</h2>
          <div className="space-y-3">
            {[
              { step: '1', label: 'Set up your shop profile', link: '/vendor/shop' },
              { step: '2', label: 'Add your products', link: '/vendor/products' },
              { step: '3', label: 'Start fulfilling orders', link: '/vendor/orders' },
            ].map(s => (
              <a key={s.step} href={s.link} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                <span className="w-7 h-7 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-semibold shrink-0">{s.step}</span>
                <span className="text-sm text-gray-700">{s.label}</span>
              </a>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Shop Status</h2>
          <div className="space-y-3">
            {[
              ['Shop Status', <span key="s" className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Active</span>],
              ['Approval', <span key="a" className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">Pending</span>],
              ['Products Listed', stats?.products || 0],
              ['Customer Rating', '4.8 ⭐'],
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
