import React, { useState, useEffect, useCallback } from 'react'
import Table from '../../components/common/Table'
import Badge from '../../components/common/Badge'
import ErrorBanner from '../../components/common/ErrorBanner'
import { adminService, errorMessage } from '../../services/api'
import { date } from '../../utils/format'

const FILTERS = ['all', 'pending', 'approved', 'rejected']

export default function AdminVendors() {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const [filter, setFilter] = useState('all')

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    adminService.getVendors()
      .then(r => setVendors(r.data))
      .catch(err => setError(errorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const handleAction = async (id, action) => {
    setActionLoading(id + action)
    setError('')
    try {
      const res = action === 'approve' ? await adminService.approveVendor(id) : await adminService.rejectVendor(id)
      setVendors(vs => vs.map(v => v._id === id ? { ...v, status: res.data.status } : v))
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setActionLoading(null)
    }
  }

  const columns = [
    { key: 'name', label: 'Shop', render: r => (
      <div>
        <p className="font-medium text-gray-800">{r.name}</p>
        {!r.hasShop && <p className="text-xs text-gray-400">No shop set up yet</p>}
        {r.hasShop && <p className="text-xs text-gray-400">Owner: {r.owner}</p>}
      </div>
    ) },
    { key: 'email', label: 'Email' },
    { key: 'products', label: 'Products' },
    { key: 'createdAt', label: 'Joined', render: r => date(r.createdAt) },
    { key: 'status', label: 'Status', render: r => <Badge text={r.status} /> },
    {
      key: 'actions', label: 'Actions',
      render: r => (
        <div className="flex gap-2">
          {r.status !== 'approved' && (
            <button
              onClick={() => handleAction(r._id, 'approve')}
              disabled={actionLoading !== null}
              className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors"
            >
              Approve
            </button>
          )}
          {r.status !== 'rejected' && (
            <button
              onClick={() => handleAction(r._id, 'reject')}
              disabled={actionLoading !== null}
              className="text-xs px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-60 transition-colors"
            >
              {r.status === 'approved' ? 'Suspend' : 'Reject'}
            </button>
          )}
        </div>
      )
    }
  ]

  const pending = vendors.filter(v => v.status === 'pending').length
  const shown = filter === 'all' ? vendors : vendors.filter(v => v.status === filter)

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Vendors</h1>
          <p className="text-gray-500 text-sm">Approve vendors before their shops appear to customers</p>
        </div>
        {pending > 0 && (
          <span className="bg-orange-100 text-orange-700 text-sm px-3 py-1.5 rounded-full font-medium">
            {pending} pending review
          </span>
        )}
      </div>

      <ErrorBanner message={error} onRetry={vendors.length ? null : load} />

      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-sm px-3 py-1 rounded-full border capitalize transition-colors ${
              filter === f ? 'bg-green-600 border-green-600 text-white' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <Table columns={columns} data={shown} loading={loading} emptyMessage="No vendors found" />
    </div>
  )
}
