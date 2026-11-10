import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import Badge from '../../components/common/Badge'
import ErrorBanner from '../../components/common/ErrorBanner'
import { customerService, errorMessage } from '../../services/api'
import { money, date } from '../../utils/format'

const STEPS = ['pending', 'processing', 'shipped', 'delivered']
const STEP_LABELS = { pending: 'Placed', processing: 'Preparing', shipped: 'On the way', delivered: 'Delivered' }

function StatusTracker({ status }) {
  if (status === 'cancelled') {
    return <p className="mt-4 text-sm text-red-500">This order was cancelled and has not been charged.</p>
  }
  const current = STEPS.indexOf(status)
  return (
    <ol className="mt-4 grid grid-cols-4 gap-2">
      {STEPS.map((step, i) => (
        <li key={step} className="flex flex-col gap-1">
          <div className={`h-1.5 rounded-full ${i <= current ? 'bg-green-500' : 'bg-gray-200'}`} />
          <span className={`text-xs ${i <= current ? 'text-green-700 font-medium' : 'text-gray-400'}`}>{STEP_LABELS[step]}</span>
        </li>
      ))}
    </ol>
  )
}

export default function CustomerOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancelling, setCancelling] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    customerService.getOrders()
      .then(r => setOrders(r.data))
      .catch(err => setError(errorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const handleCancel = async (order) => {
    if (!confirm(`Cancel order #${order._id} from ${order.shop}?`)) return
    setCancelling(order._id)
    setError('')
    try {
      const res = await customerService.cancelOrder(order._id)
      setOrders(os => os.map(o => o._id === order._id ? res.data : o))
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setCancelling(null)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex justify-center">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">My Orders</h1>
      <p className="text-gray-500 text-sm mb-6">Track your order history</p>

      <ErrorBanner message={error} onRetry={orders.length ? null : load} />

      {orders.length === 0 && !error ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-5xl mb-3">📦</div>
          <p className="mb-4">No orders yet.</p>
          <Link to="/" className="text-green-600 font-medium hover:text-green-700">Start shopping →</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order._id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm text-gray-500">#{order._id}</span>
                    <Badge text={order.status} />
                  </div>
                  <p className="font-semibold text-gray-800">{order.shop}</p>
                  <p className="text-xs text-gray-400">{date(order.createdAt)} · {order.deliveryAddress}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-800 text-lg">{money(order.total)}</p>
                  <p className="text-xs text-gray-400">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleCancel(order)}
                      disabled={cancelling === order._id}
                      className="mt-2 text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                    >
                      {cancelling === order._id ? 'Cancelling...' : 'Cancel order'}
                    </button>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3">
                <div className="space-y-1">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm text-gray-600">
                      <span>{item.name} × {item.qty}</span>
                      <span>{money(item.price * item.qty)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <StatusTracker status={order.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
