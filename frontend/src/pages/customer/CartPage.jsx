import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import ErrorBanner from '../../components/common/ErrorBanner'
import { customerService, errorMessage } from '../../services/api'
import { money } from '../../utils/format'

export default function CartPage() {
  const { items, updateQty, removeItem, clearCart, total } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [placing, setPlacing] = useState(false)
  const [placed, setPlaced] = useState(null) // the orders created at checkout
  const [error, setError] = useState('')
  const [address, setAddress] = useState(user?.address || '')

  // Pre-fill the delivery address from the profile.
  useEffect(() => {
    customerService.getProfile()
      .then(r => setAddress(a => a || r.data.address || ''))
      .catch(() => {})
  }, [])

  // Group items by shop: each shop gets its own order.
  const grouped = items.reduce((acc, item) => {
    if (!acc[item.shopId]) acc[item.shopId] = { shopName: item.shopName, items: [] }
    acc[item.shopId].items.push(item)
    return acc
  }, {})
  const shopCount = Object.keys(grouped).length

  const handleCheckout = async () => {
    if (!address.trim()) {
      setError('Please enter a delivery address')
      return
    }
    setPlacing(true)
    setError('')
    try {
      const res = await customerService.placeOrder({
        items: items.map(i => ({ productId: i.productId, qty: i.qty })),
        deliveryAddress: address.trim(),
      })
      clearCart()
      setPlaced(res.data)
    } catch (err) {
      setError(errorMessage(err, "We couldn't place your order. Please try again."))
    } finally {
      setPlacing(false)
    }
  }

  if (placed) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Order placed!</h2>
        <p className="text-gray-500 mb-6">
          {placed.length > 1
            ? `Your items were split into ${placed.length} orders, one per shop (${placed.map(o => '#' + o._id).join(', ')}).`
            : `Order #${placed[0]?._id} has been sent to ${placed[0]?.shop}.`}
        </p>
        <div className="flex justify-center gap-3">
          <button onClick={() => navigate('/orders')} className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors">
            Track my orders
          </button>
          <Link to="/" className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors">
            Keep shopping
          </Link>
        </div>
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

      <ErrorBanner message={error} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {Object.entries(grouped).map(([shopId, group]) => (
            <div key={shopId} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                <Link to={`/shop/${shopId}`} className="font-semibold text-gray-700 text-sm hover:text-green-700">🏪 {group.shopName}</Link>
              </div>
              <div className="divide-y divide-gray-100">
                {group.items.map(item => (
                  <div key={item.productId} className="flex items-center gap-4 px-5 py-4">
                    <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                      {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover" /> : '🥗'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 text-sm">{item.name}</p>
                      <p className="text-green-600 text-sm">{money(item.price)} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQty(item.productId, item.qty - 1)}
                        className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm font-medium">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.productId, item.qty + 1)}
                        disabled={item.stock != null && item.qty >= item.stock}
                        className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-gray-800">{money(item.price * item.qty)}</p>
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
                <span className="text-gray-800">{money(total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delivery</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-3 mb-4">
              <div className="flex justify-between font-bold text-gray-800">
                <span>Total</span>
                <span>{money(total)}</span>
              </div>
              {shopCount > 1 && (
                <p className="text-xs text-gray-400 mt-2">Delivered as {shopCount} separate orders, one from each shop.</p>
              )}
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery address</label>
            <textarea
              value={address}
              onChange={e => setAddress(e.target.value)}
              rows={2}
              maxLength={300}
              placeholder="Street, building, city"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
            <button
              onClick={handleCheckout}
              disabled={placing}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium text-sm transition-colors disabled:opacity-60"
            >
              {placing ? 'Placing order...' : 'Place Order'}
            </button>
            <p className="text-xs text-gray-400 text-center mt-2">Pay on delivery</p>
            <button
              onClick={() => confirm('Remove everything from your cart?') && clearCart()}
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
