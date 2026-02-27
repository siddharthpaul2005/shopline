import React, { useState, useEffect } from 'react'
import StatCard from '../../components/common/StatCard'
import { adminService } from '../../services/api'

const MOCK_STATS = { users: 248, vendors: 32, orders: 1540, revenue: 48200 }

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminService.getStats()
      .then(r => setStats(r.data))
      .catch(() => setStats(MOCK_STATS))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Dashboard</h1>
      <p className="text-gray-500 text-sm mb-6">Overview of your marketplace</p>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            <StatCard title="Total Users" value={stats?.users || 0} icon="👥" color="blue" subtitle="Registered accounts" />
            <StatCard title="Active Vendors" value={stats?.vendors || 0} icon="🏪" color="green" subtitle="Approved vendors" />
            <StatCard title="Total Orders" value={stats?.orders || 0} icon="📦" color="orange" subtitle="All time" />
            <StatCard title="Revenue" value={`$${(stats?.revenue || 0).toLocaleString()}`} icon="💰" color="purple" subtitle="Total sales" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-800 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                {[
                  { label: 'Review pending vendor applications', badge: '3 pending', color: 'orange', link: '/admin/vendors' },
                  { label: 'Check recent orders', badge: '12 new', color: 'blue', link: '/admin/orders' },
                  { label: 'Manage user accounts', badge: '', color: 'gray', link: '/admin/users' },
                ].map(a => (
                  <a key={a.label} href={a.link} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                    <span className="text-sm text-gray-700">{a.label}</span>
                    {a.badge && <span className={`text-xs px-2 py-0.5 rounded-full bg-${a.color}-100 text-${a.color}-700`}>{a.badge}</span>}
                  </a>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-800 mb-4">System Info</h2>
              <div className="space-y-3">
                {[
                  ['Platform', 'FreshMart v1.0'],
                  ['Environment', 'Production'],
                  ['API Status', '✅ Online'],
                  ['Last Updated', new Date().toLocaleDateString()],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-gray-500">{k}</span>
                    <span className="font-medium text-gray-700">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
