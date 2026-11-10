import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import ErrorBanner from '../../components/common/ErrorBanner'
import { customerService, errorMessage } from '../../services/api'

const CATEGORY_ICONS = {
  'Organic': '🌿', 'Fruits & Vegetables': '🥦', 'General Grocery': '🛒',
  'Bakery': '🍞', 'Dairy': '🥛', 'Seafood': '🐟', 'Meat & Poultry': '🥩',
}

const categories = ['All', 'Organic', 'Fruits & Vegetables', 'Bakery', 'Dairy', 'Meat & Poultry', 'Seafood', 'General Grocery']

export default function CustomerHome() {
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    customerService.getShops()
      .then(r => setShops(r.data))
      .catch(err => setError(errorMessage(err, "Couldn't load shops.")))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const q = search.toLowerCase()
  const filtered = shops.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
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
        <p className="text-gray-500 text-sm">{filtered.length} shop{filtered.length !== 1 ? 's' : ''} found</p>
      </div>

      <ErrorBanner message={error} onRetry={load} />

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">{shops.length === 0 ? 'No shops are open yet. Check back soon!' : 'No shops found matching your search'}</div>
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
