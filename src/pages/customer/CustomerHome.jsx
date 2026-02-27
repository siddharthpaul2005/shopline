import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { customerService } from '../../services/api'

const MOCK_SHOPS = [
  { _id: '1', name: 'Green Valley Farms', category: 'Organic', description: 'Fresh organic produce from our farm', rating: 4.8, products: 45, image: '' },
  { _id: '2', name: 'City Organic', category: 'Fruits & Vegetables', description: 'Daily fresh fruits and vegetables', rating: 4.5, products: 62, image: '' },
  { _id: '3', name: 'Fresh Picks', category: 'General Grocery', description: 'Your one-stop grocery shop', rating: 4.3, products: 128, image: '' },
  { _id: '4', name: 'Sunrise Bakery', category: 'Bakery', description: 'Freshly baked goods every morning', rating: 4.9, products: 34, image: '' },
  { _id: '5', name: 'Dairy Direct', category: 'Dairy', description: 'Fresh dairy products from local farms', rating: 4.6, products: 28, image: '' },
  { _id: '6', name: 'Ocean Fresh', category: 'Seafood', description: 'The freshest catch of the day', rating: 4.7, products: 55, image: '' },
]

const CATEGORY_ICONS = {
  'Organic': '🌿', 'Fruits & Vegetables': '🥦', 'General Grocery': '🛒',
  'Bakery': '🍞', 'Dairy': '🥛', 'Seafood': '🐟', 'Meat & Poultry': '🥩',
}

const categories = ['All', 'Organic', 'Fruits & Vegetables', 'Bakery', 'Dairy', 'Seafood', 'General Grocery']

export default function CustomerHome() {
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')

  useEffect(() => {
    customerService.getShops()
      .then(r => setShops(r.data))
      .catch(() => setShops(MOCK_SHOPS))
      .finally(() => setLoading(false))
  }, [])

  const filtered = shops.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase())
    const matchCategory = category === 'All' || s.category === category
    return matchSearch && matchCategory
  })

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-8 mb-8 text-white">
        <h1 className="font-display text-3xl md:text-4xl mb-2">Fresh groceries, delivered</h1>
        <p className="text-green-100 mb-6">Shop from local vendors in your neighborhood</p>
        <div className="relative max-w-md">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search for shops..."
            className="w-full pl-10 pr-4 py-3 rounded-xl text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white"
          />
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              category === c ? 'bg-green-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-green-300'
            }`}
          >
            {CATEGORY_ICONS[c] || ''} {c}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-500 text-sm">{filtered.length} shops found</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No shops found matching your search</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(shop => (
            <Link key={shop._id} to={`/shop/${shop._id}`} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
              <div className="h-40 bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
                {shop.image ? (
                  <img src={shop.image} alt={shop.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl">{CATEGORY_ICONS[shop.category] || '🛒'}</span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-semibold text-gray-800 group-hover:text-green-600 transition-colors">{shop.name}</h3>
                  <span className="text-sm text-yellow-500">⭐ {shop.rating}</span>
                </div>
                <p className="text-xs text-green-600 font-medium mb-2">{shop.category}</p>
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{shop.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{shop.products} products</span>
                  <span className="text-xs text-green-600 font-medium">Shop now →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
