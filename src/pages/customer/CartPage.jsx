import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { customerService } from '../../services/api'

export default function CartPage() {
  const { items, updateQty, removeItem, clearCart, total } = useCart()
  const navigate = useNavigate()
  const [placing, setPlacing] = useState(false)
  const [success, setSuccess] = useState(false)

  // Group items by vendor/shop
  const grouped = items.reduce((acc, item) => {
    if (!acc[item.shopId]) acc[item.shopId] = { shopName: item.shopName, items: [] }
    acc[item.shopId].items.push(item)
    return acc
  }, {})

  const handleCheckout = async () => {
    setPlacing(true)
    try {
      await customerService.placeOrder({ items, total })
    } catch {}
    clearCart()
    setSuccess(true)
    setTimeout(() => navigate('/orders'), 2000)
    setPlacing(false)
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Placed!</h2>
        <p className="text-gray-500 mb-4">Your order has been successfully placed. Redirecting to orders...</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Add products from shops to get started</p>
        <Link to="/" className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors">
          Browse Shops
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {Object.entries(grouped).map(([shopId, group]) => (
            <div key={shopId} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                <p className="font-semibold text-gray-700 text-sm">🏪 {group.shopName}</p>
              </div>
              <div className="divide-y divide-gray-100">
                {group.items.map(item => (
                  <div key={item.productId} className="flex items-center gap-4 px-5 py-4">
                    <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center text-2xl shrink-0">
                      🥗
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 text-sm">{item.name}</p>
                      <p className="text-green-600 text-sm">${item.price.toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQty(item.productId, item.qty - 1)}
                        className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm font-medium">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.productId, item.qty + 1)}
                        className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-gray-800">${(item.price * item.qty).toFixed(2)}</p>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="text-xs text-red-400 hover:text-red-600 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-24">
            <h2 className="font-semibold text-gray-800 mb-4">Order Summary</h2>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-800">${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delivery</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-3 mb-4">
              <div className="flex justify-between font-bold text-gray-800">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={handleCheckout}
              disabled={placing}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium text-sm transition-colors disabled:opacity-60"
            >
              {placing ? 'Placing order...' : 'Place Order'}
            </button>
            <button
              onClick={clearCart}
              className="w-full mt-2 text-sm text-red-400 hover:text-red-600 transition-colors py-2"
            >
              Clear cart
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
