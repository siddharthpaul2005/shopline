import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { customerService } from '../../services/api'
import { useCart } from '../../context/CartContext'

const MOCK_SHOP = { _id: '1', name: 'Green Valley Farms', category: 'Organic', description: 'Fresh organic produce from our farm to your table. We believe in sustainable farming and healthy eating.', rating: 4.8, address: '123 Farm Road, Green Valley', phone: '+1 234 567 8900' }
const MOCK_PRODUCTS = [
  { _id: 'p1', name: 'Organic Apples', price: 3.99, stock: 100, category: 'Fruits', description: 'Crisp and sweet organic apples', image: '' },
  { _id: 'p2', name: 'Fresh Spinach', price: 2.49, stock: 50, category: 'Vegetables', description: 'Baby spinach leaves, perfect for salads', image: '' },
  { _id: 'p3', name: 'Kale Bunch', price: 1.99, stock: 40, category: 'Vegetables', description: 'Curly kale, packed with nutrients', image: '' },
  { _id: 'p4', name: 'Carrots (1kg)', price: 1.49, stock: 80, category: 'Vegetables', description: 'Sweet baby carrots', image: '' },
  { _id: 'p5', name: 'Organic Bananas', price: 2.99, stock: 60, category: 'Fruits', description: 'Fair-trade organic bananas', image: '' },
  { _id: 'p6', name: 'Cherry Tomatoes', price: 3.49, stock: 45, category: 'Vegetables', description: 'Vine-ripened cherry tomatoes', image: '' },
]

const EMOJI_MAP = { 'Fruits': '🍎', 'Vegetables': '🥦', 'Dairy': '🥛', 'Bakery': '🍞', 'Meat': '🥩', 'Seafood': '🐟' }

export default function ShopDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addItem, items } = useCart()
  const [shop, setShop] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [added, setAdded] = useState({})

  useEffect(() => {
    Promise.all([
      customerService.getShop(id),
      customerService.getShopProducts(id)
    ]).then(([shopRes, productsRes]) => {
      setShop(shopRes.data)
      setProducts(productsRes.data)
    }).catch(() => {
      setShop(MOCK_SHOP)
      setProducts(MOCK_PRODUCTS)
    }).finally(() => setLoading(false))
  }, [id])

  const handleAdd = (product) => {
    addItem(product, shop)
    setAdded(a => ({ ...a, [product._id]: true }))
    setTimeout(() => setAdded(a => ({ ...a, [product._id]: false })), 1500)
  }

  const getCartQty = (productId) => {
    const item = items.find(i => i.productId === productId)
    return item?.qty || 0
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!shop) return <div className="text-center py-24 text-gray-400">Shop not found</div>

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Back button */}
      <button onClick={() => navigate('/')} className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1">
        ← Back to shops
      </button>

      {/* Shop header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center text-3xl">🌿</div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{shop.name}</h1>
              <p className="text-green-600 text-sm font-medium">{shop.category}</p>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                <span>⭐ {shop.rating}</span>
                {shop.address && <span>📍 {shop.address}</span>}
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/cart')}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            🛒 View Cart
          </button>
        </div>
        {shop.description && (
          <p className="mt-4 text-gray-600 text-sm border-t border-gray-100 pt-4">{shop.description}</p>
        )}
      </div>

      {/* Products */}
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Products ({products.length})</h2>
      {products.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No products available</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map(product => (
            <div key={product._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="h-32 bg-gray-50 flex items-center justify-center">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">{EMOJI_MAP[product.category] || '🥗'}</span>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-medium text-gray-800 text-sm mb-0.5">{product.name}</h3>
                <p className="text-xs text-gray-500 mb-2 line-clamp-1">{product.description}</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-green-600">${parseFloat(product.price).toFixed(2)}</span>
                  <button
                    onClick={() => handleAdd(product)}
                    disabled={product.stock === 0}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      added[product._id]
                        ? 'bg-green-100 text-green-700'
                        : product.stock === 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {added[product._id] ? '✓ Added' : product.stock === 0 ? 'Out of stock' : `+ Add${getCartQty(product._id) > 0 ? ` (${getCartQty(product._id)})` : ''}`}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
