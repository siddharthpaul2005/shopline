import React, { useState, useEffect } from 'react'
import Table from '../../components/common/Table'
import Badge from '../../components/common/Badge'
import { adminService } from '../../services/api'

const MOCK = [
  { _id: '1', name: 'Green Valley Farms', email: 'green@valley.com', status: 'pending', createdAt: '2024-01-10', products: 24 },
  { _id: '2', name: 'City Organic', email: 'city@organic.com', status: 'approved', createdAt: '2024-01-05', products: 56 },
  { _id: '3', name: 'Fresh Picks', email: 'fresh@picks.com', status: 'rejected', createdAt: '2024-01-08', products: 0 },
  { _id: '4', name: 'Sunrise Market', email: 'sunrise@market.com', status: 'pending', createdAt: '2024-01-12', products: 0 },
]

export default function AdminVendors() {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    adminService.getVendors()
      .then(r => setVendors(r.data))
      .catch(() => setVendors(MOCK))
      .finally(() => setLoading(false))
  }, [])

  const handleAction = async (id, action) => {
    setActionLoading(id + action)
    try {
      if (action === 'approve') await adminService.approveVendor(id)
      else await adminService.rejectVendor(id)
      setVendors(vs => vs.map(v => v._id === id ? { ...v, status: action === 'approve' ? 'approved' : 'rejected' } : v))
    } catch {
      setVendors(vs => vs.map(v => v._id === id ? { ...v, status: action === 'approve' ? 'approved' : 'rejected' } : v))
    } finally {
      setActionLoading(null)
    }
  }

  const columns = [
    { key: 'name', label: 'Vendor Name' },
    { key: 'email', label: 'Email' },
    { key: 'products', label: 'Products', render: r => r.products || 0 },
    { key: 'createdAt', label: 'Joined', render: r => new Date(r.createdAt).toLocaleDateString() },
    { key: 'status', label: 'Status', render: r => <Badge text={r.status} /> },
    {
      key: 'actions', label: 'Actions',
      render: r => (
        <div className="flex gap-2">
          {r.status !== 'approved' && (
            <button
              onClick={() => handleAction(r._id, 'approve')}
              disabled={actionLoading === r._id + 'approve'}
              className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors"
            >
              Approve
            </button>
          )}
          {r.status !== 'rejected' && (
            <button
              onClick={() => handleAction(r._id, 'reject')}
              disabled={actionLoading === r._id + 'reject'}
              className="text-xs px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-60 transition-colors"
            >
              Reject
            </button>
          )}
        </div>
      )
    }
  ]

  const pending = vendors.filter(v => v.status === 'pending').length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Vendors</h1>
          <p className="text-gray-500 text-sm">Manage vendor applications and accounts</p>
        </div>
        {pending > 0 && (
          <span className="bg-orange-100 text-orange-700 text-sm px-3 py-1.5 rounded-full font-medium">
            {pending} pending review
          </span>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {['all', 'pending', 'approved', 'rejected'].map(f => (
          <span key={f} className="text-sm px-3 py-1 rounded-full border border-gray-200 bg-white text-gray-600 capitalize cursor-pointer hover:bg-gray-50">
            {f}
          </span>
        ))}
      </div>

      <Table columns={columns} data={vendors} loading={loading} emptyMessage="No vendors found" />
    </div>
  )
}
