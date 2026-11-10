import React, { useState, useEffect, useCallback } from 'react'
import Table from '../../components/common/Table'
import Badge from '../../components/common/Badge'
import ErrorBanner from '../../components/common/ErrorBanner'
import { adminService, errorMessage } from '../../services/api'
import { money, date } from '../../utils/format'

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    adminService.getOrders()
      .then(r => setOrders(r.data))
      .catch(err => setError(errorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const columns = [
    { key: '_id', label: 'Order', render: r => <span className="font-mono text-xs text-gray-600">#{r._id}</span> },
    { key: 'customer', label: 'Customer' },
    { key: 'shop', label: 'Shop' },
    { key: 'items', label: 'Items', render: r => {
      const n = r.items.reduce((sum, i) => sum + i.qty, 0)
      return `${n} item${n !== 1 ? 's' : ''}`
    } },
    { key: 'total', label: 'Total', render: r => money(r.total) },
    { key: 'status', label: 'Status', render: r => <Badge text={r.status} /> },
    { key: 'createdAt', label: 'Date', render: r => date(r.createdAt) },
  ]

  const summary = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing' || o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Orders</h1>
      <p className="text-gray-500 text-sm mb-6">Monitor all marketplace orders</p>

      <ErrorBanner message={error} onRetry={load} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', value: summary.total, color: 'bg-gray-100 text-gray-700' },
          { label: 'Pending', value: summary.pending, color: 'bg-yellow-100 text-yellow-700' },
          { label: 'In progress', value: summary.processing, color: 'bg-blue-100 text-blue-700' },
          { label: 'Delivered', value: summary.delivered, color: 'bg-green-100 text-green-700' },
        ].map(s => (
          <div key={s.label} className={`rounded-lg p-3 text-center ${s.color}`}>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      <Table columns={columns} data={orders} loading={loading} emptyMessage="No orders yet" />
    </div>
  )
}
