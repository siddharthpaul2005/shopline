import React, { useState, useEffect } from 'react'
import Table from '../../components/common/Table'
import Badge from '../../components/common/Badge'
import { adminService } from '../../services/api'

const MOCK = [
  { _id: '1', name: 'Alice Johnson', email: 'alice@email.com', role: 'customer', createdAt: '2024-01-01', orders: 12 },
  { _id: '2', name: 'Bob Smith', email: 'bob@email.com', role: 'vendor', createdAt: '2024-01-03', orders: 0 },
  { _id: '3', name: 'Carol White', email: 'carol@email.com', role: 'customer', createdAt: '2024-01-05', orders: 5 },
  { _id: '4', name: 'Super Admin', email: 'admin@freshmart.com', role: 'admin', createdAt: '2023-12-01', orders: 0 },
]

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    adminService.getUsers()
      .then(r => setUsers(r.data))
      .catch(() => setUsers(MOCK))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    try {
      await adminService.deleteUser(id)
    } catch {}
    setUsers(us => us.filter(u => u._id !== id))
  }

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: r => <Badge text={r.role} /> },
    { key: 'orders', label: 'Orders', render: r => r.orders || 0 },
    { key: 'createdAt', label: 'Joined', render: r => new Date(r.createdAt).toLocaleDateString() },
    {
      key: 'actions', label: 'Actions',
      render: r => r.role !== 'admin' ? (
        <button
          onClick={() => handleDelete(r._id)}
          className="text-xs px-3 py-1.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
        >
          Delete
        </button>
      ) : <span className="text-xs text-gray-400">Protected</span>
    }
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Users</h1>
      <p className="text-gray-500 text-sm mb-6">Manage registered users</p>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <Table columns={columns} data={filtered} loading={loading} emptyMessage="No users found" />
    </div>
  )
}
