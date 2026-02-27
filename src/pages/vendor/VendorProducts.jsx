import React, { useState, useEffect } from 'react'
import Modal from '../../components/common/Modal'
import Badge from '../../components/common/Badge'
import { vendorService } from '../../services/api'

const MOCK = [
  { _id: '1', name: 'Organic Apples', price: 3.99, stock: 100, category: 'Fruits', status: 'active', image: '' },
  { _id: '2', name: 'Fresh Spinach', price: 2.49, stock: 50, category: 'Vegetables', status: 'active', image: '' },
  { _id: '3', name: 'Whole Milk', price: 4.50, stock: 30, category: 'Dairy', status: 'inactive', image: '' },
]

const EMPTY_FORM = { name: '', description: '', price: '', stock: '', category: '', image: '', status: 'active' }

export default function VendorProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    vendorService.getProducts()
      .then(r => setProducts(r.data))
      .catch(() => setProducts(MOCK))
      .finally(() => setLoading(false))
  }, [])

  const openCreate = () => {
    setEditProduct(null)
    setForm(EMPTY_FORM)
    setError('')
    setModalOpen(true)
  }

  const openEdit = (product) => {
    setEditProduct(product)
    setForm({ ...product, price: product.price.toString(), stock: product.stock.toString() })
    setError('')
    setModalOpen(true)
  }

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSave = async () => {
    setSaving(true)
    setError('')
    const payload = { ...form, price: parseFloat(form.price), stock: parseInt(form.stock) }
    try {
      if (editProduct) {
        await vendorService.updateProduct(editProduct._id, payload)
        setProducts(ps => ps.map(p => p._id === editProduct._id ? { ...p, ...payload } : p))
      } else {
        const res = await vendorService.createProduct(payload)
        setProducts(ps => [...ps, res.data])
      }
      setModalOpen(false)
    } catch {
      // Demo mode: update local state
      if (editProduct) {
        setProducts(ps => ps.map(p => p._id === editProduct._id ? { ...p, ...payload } : p))
      } else {
        setProducts(ps => [...ps, { ...payload, _id: Date.now().toString() }])
      }
      setModalOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return
    try { await vendorService.deleteProduct(id) } catch {}
    setProducts(ps => ps.filter(p => p._id !== id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Products</h1>
          <p className="text-gray-500 text-sm">Manage your product listings</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Add Product
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-400">
              No products yet. Add your first product!
            </div>
          ) : products.map(p => (
            <div key={p._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="h-36 bg-gray-100 flex items-center justify-center">
                {p.image ? (
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">🥦</span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-semibold text-gray-800 text-sm">{p.name}</h3>
                  <Badge text={p.status} />
                </div>
                <p className="text-xs text-gray-500 mb-2">{p.category}</p>
                <div className="flex justify-between text-sm mb-4">
                  <span className="font-bold text-green-600">${parseFloat(p.price).toFixed(2)}</span>
                  <span className="text-gray-500">{p.stock} in stock</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(p)}
                    className="flex-1 text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p._id)}
                    className="flex-1 text-xs px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editProduct ? 'Edit Product' : 'Add New Product'}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.name || !form.price}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60"
            >
              {saving ? 'Saving...' : editProduct ? 'Save Changes' : 'Add Product'}
            </button>
          </>
        }
      >
        {error && <div className="mb-3 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
            <input name="name" required value={form.name} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g. Organic Apples" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={2}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              placeholder="Product description..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price ($) *</label>
              <input name="price" type="number" step="0.01" required value={form.price} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
              <input name="stock" type="number" value={form.stock} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="0" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select name="category" value={form.category} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Select...</option>
                {['Fruits', 'Vegetables', 'Dairy', 'Bakery', 'Meat', 'Seafood', 'Snacks', 'Beverages'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select name="status" value={form.status} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
            <input name="image" value={form.image} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="https://example.com/image.jpg" />
          </div>
        </div>
      </Modal>
    </div>
  )
}
