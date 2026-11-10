import React, { useState, useEffect, useCallback } from 'react'
import Badge from '../../components/common/Badge'
import ErrorBanner from '../../components/common/ErrorBanner'
import { vendorService, errorMessage } from '../../services/api'
import { money, date } from '../../utils/format'

// Which statuses an order can move to next (mirrors the backend's OrderStatus rules).
const NEXT_STATUSES = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
}

const ACTION_LABELS = {
  processing: 'Accept & prepare',
  shipped: 'Mark as shipped',
  delivered: 'Mark as delivered',
  cancelled: 'Cancel order',
}

const FILTERS = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled']

export default function VendorOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    vendorService.getOrders()
      .then(r => setOrders(r.data))
      .catch(err => setError(errorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const handleStatusChange = async (order, newStatus) => {
    if (newStatus === 'cancelled' && !confirm(`Cancel order #${order._id}? The items go back into stock.`)) return
    setUpdating(order._id)
    setError('')
    try {
      const res = await vendorService.updateOrderStatus(order._id, newStatus)
      setOrders(os => os.map(o => o._id === order._id ? res.data : o))
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setUpdating(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const shown = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Orders</h1>
      <p className="text-gray-500 text-sm mb-6">Manage and fulfill customer orders</p>

      <ErrorBanner message={error} onRetry={orders.length ? null : load} />

      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map(f => {
          const n = f === 'all' ? orders.length : orders.filter(o => o.status === f).length
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-sm px-3 py-1 rounded-full border capitalize transition-colors ${
                filter === f ? 'bg-green-600 border-green-600 text-white' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f} ({n})
            </button>
          )
        })}
      </div>

      {shown.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          {orders.length === 0 ? 'No orders yet' : 'No orders with this status'}
        </div>
      ) : (
        <div className="space-y-4">
          {shown.map(order => (
            <div key={order._id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-sm text-gray-500">#{order._id}</span>
                    <Badge text={order.status} />
                  </div>
                  <p className="font-medium text-gray-800">{order.customer}</p>
                  <p className="text-xs text-gray-500">📍 {order.deliveryAddress}</p>
                  {order.customerPhone && <p className="text-xs text-gray-500">📞 {order.customerPhone}</p>}
                  <p className="text-xs text-gray-400 mt-1">{date(order.createdAt)}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="font-bold text-gray-800">{money(order.total)}</span>
                  <div className="flex flex-wrap justify-end gap-2">
                    {NEXT_STATUSES[order.status].map(next => (
                      <button
                        key={next}
                        disabled={updating === order._id}
                        onClick={() => handleStatusChange(order, next)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                          next === 'cancelled'
                            ? 'border border-red-200 text-red-600 hover:bg-red-50'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {updating === order._id ? 'Updating...' : ACTION_LABELS[next]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-medium text-gray-500 mb-2">Order Items</p>
                <div className="space-y-1">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-700">{item.name} × {item.qty}</span>
                      <span className="text-gray-600">{money(item.price * item.qty)}</span>
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
