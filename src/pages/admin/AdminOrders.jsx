import React, { useState, useEffect } from 'react'
import Table from '../../components/common/Table'
import Badge from '../../components/common/Badge'
import { adminService } from '../../services/api'

const MOCK = [
  { _id: 'ORD001', customer: 'Alice Johnson', vendor: 'Green Valley', total: 45.50, status: 'delivered', createdAt: '2024-01-10', items: 3 },
  { _id: 'ORD002', customer: 'Bob Smith', vendor: 'City Organic', total: 28.00, status: 'processing', createdAt: '2024-01-12', items: 2 },
  { _id: 'ORD003', customer: 'Carol White', vendor: 'Fresh Picks', total: 67.25, status: 'shipped', createdAt: '2024-01-13', items: 5 },
  { _id: 'ORD004', customer: 'Dave Brown', vendor: 'Green Valley', total: 15.99, status: 'pending', createdAt: '2024-01-14', items: 1 },
  { _id: 'ORD005', customer: 'Eve Davis', vendor: 'City Organic', total: 93.40, status: 'cancelled', createdAt: '2024-01-09', items: 7 },
]

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminService.getOrders()
      .then(r => setOrders(r.data))
      .catch(() => setOrders(MOCK))
      .finally(() => setLoading(false))
  }, [])

  const columns = [
    { key: '_id', label: 'Order ID', render: r => <span className="font-mono text-xs text-gray-600">{r._id}</span> },
    { key: 'customer', label: 'Customer' },
    { key: 'vendor', label: 'Vendor' },
    { key: 'items', label: 'Items', render: r => `${r.items} item${r.items !== 1 ? 's' : ''}` },
    { key: 'total', label: 'Total', render: r => `$${r.total.toFixed(2)}` },
    { key: 'status', label: 'Status', render: r => <Badge text={r.status} /> },
    { key: 'createdAt', label: 'Date', render: r => new Date(r.createdAt).toLocaleDateString() },
  ]

  const summary = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Orders</h1>
      <p className="text-gray-500 text-sm mb-6">Monitor all marketplace orders</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', value: summary.total, color: 'bg-gray-100 text-gray-700' },
          { label: 'Pending', value: summary.pending, color: 'bg-yellow-100 text-yellow-700' },
          { label: 'Processing', value: summary.processing, color: 'bg-blue-100 text-blue-700' },
          { label: 'Delivered', value: summary.delivered, color: 'bg-green-100 text-green-700' },
        ].map(s => (
          <div key={s.label} className={`rounded-lg p-3 text-center ${s.color}`}>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      <Table columns={columns} data={orders} loading={loading} emptyMessage="No orders found" />
    </div>
  )
}
