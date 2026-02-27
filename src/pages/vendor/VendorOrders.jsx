import React, { useState, useEffect } from 'react'
import Badge from '../../components/common/Badge'
import { vendorService } from '../../services/api'

const MOCK = [
  { _id: 'ORD001', customer: 'Alice Johnson', items: [{ name: 'Organic Apples', qty: 2, price: 3.99 }], total: 7.98, status: 'pending', createdAt: '2024-01-14' },
  { _id: 'ORD002', customer: 'Bob Smith', items: [{ name: 'Fresh Spinach', qty: 1, price: 2.49 }, { name: 'Whole Milk', qty: 2, price: 4.50 }], total: 11.49, status: 'processing', createdAt: '2024-01-13' },
  { _id: 'ORD003', customer: 'Carol White', items: [{ name: 'Organic Apples', qty: 5, price: 3.99 }], total: 19.95, status: 'shipped', createdAt: '2024-01-12' },
  { _id: 'ORD004', customer: 'Dave Brown', items: [{ name: 'Fresh Spinach', qty: 3, price: 2.49 }], total: 7.47, status: 'delivered', createdAt: '2024-01-10' },
]

const STATUS_FLOW = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']

export default function VendorOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)

  useEffect(() => {
    vendorService.getOrders()
      .then(r => setOrders(r.data))
      .catch(() => setOrders(MOCK))
      .finally(() => setLoading(false))
  }, [])

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdating(orderId)
    try {
      await vendorService.updateOrderStatus(orderId, newStatus)
    } catch {}
    setOrders(os => os.map(o => o._id === orderId ? { ...o, status: newStatus } : o))
    setUpdating(null)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Orders</h1>
      <p className="text-gray-500 text-sm mb-6">Manage and fulfill customer orders</p>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          No orders yet
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order._id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-sm text-gray-500">#{order._id}</span>
                    <Badge text={order.status} />
                  </div>
                  <p className="font-medium text-gray-800">{order.customer}</p>
                  <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-800">${order.total.toFixed(2)}</span>
                  <div className="relative">
                    <select
                      value={order.status}
                      disabled={updating === order._id || order.status === 'delivered' || order.status === 'cancelled'}
                      onChange={e => handleStatusChange(order._id, e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {STATUS_FLOW.map(s => (
                        <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                    {updating === order._id && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                    )}
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-medium text-gray-500 mb-2">Order Items</p>
                <div className="space-y-1">
                  {(order.items || []).map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-700">{item.name} × {item.qty}</span>
                      <span className="text-gray-600">${(item.price * item.qty).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
