import React, { useState, useEffect } from 'react'
import Badge from '../../components/common/Badge'
import { customerService } from '../../services/api'

const MOCK = [
  { _id: 'ORD001', shop: 'Green Valley Farms', items: [{ name: 'Organic Apples', qty: 2, price: 3.99 }, { name: 'Fresh Spinach', qty: 1, price: 2.49 }], total: 10.47, status: 'delivered', createdAt: '2024-01-10' },
  { _id: 'ORD002', shop: 'City Organic', items: [{ name: 'Cherry Tomatoes', qty: 3, price: 3.49 }], total: 10.47, status: 'shipped', createdAt: '2024-01-13' },
  { _id: 'ORD003', shop: 'Fresh Picks', items: [{ name: 'Kale Bunch', qty: 2, price: 1.99 }], total: 3.98, status: 'processing', createdAt: '2024-01-14' },
]

export default function CustomerOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    customerService.getOrders()
      .then(r => setOrders(r.data))
      .catch(() => setOrders(MOCK))
      .finally(() => setLoading(false))
  }, [])

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

      {orders.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-5xl mb-3">📦</div>
          <p>No orders yet. Start shopping!</p>
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
                  <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-800 text-lg">${order.total.toFixed(2)}</p>
                  <p className="text-xs text-gray-400">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3">
                <div className="space-y-1">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm text-gray-600">
                      <span>{item.name} × {item.qty}</span>
                      <span>${(item.price * item.qty).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status tracker */}
              <div className="mt-4 flex items-center gap-1">
                {['pending', 'processing', 'shipped', 'delivered'].map((s, i, arr) => {
                  const statuses = ['pending', 'processing', 'shipped', 'delivered']
                  const currentIdx = statuses.indexOf(order.status)
                  const stepIdx = statuses.indexOf(s)
                  const done = stepIdx <= currentIdx && order.status !== 'cancelled'
                  return (
                    <React.Fragment key={s}>
                      <div className={`flex flex-col items-center ${i > 0 ? 'flex-1' : ''}`}>
                        {i > 0 && <div className={`h-0.5 w-full mb-1 ${done ? 'bg-green-500' : 'bg-gray-200'}`} />}
                        {i === 0 && (
                          <div className={`w-3 h-3 rounded-full ${done ? 'bg-green-500' : 'bg-gray-200'}`} />
                        )}
                        <span className="text-xs text-gray-400 capitalize hidden sm:block">{s}</span>
                      </div>
                      {i < arr.length - 1 && i > 0 && (
                        <div className={`flex-1 h-0.5 ${stepIdx < currentIdx && order.status !== 'cancelled' ? 'bg-green-500' : 'bg-gray-200'}`} />
                      )}
                      {i > 0 && (
                        <div className={`w-3 h-3 rounded-full shrink-0 ${done ? 'bg-green-500' : 'bg-gray-200'}`} />
                      )}
                    </React.Fragment>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
