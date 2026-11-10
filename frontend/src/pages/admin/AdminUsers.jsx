import React, { useState, useEffect, useCallback } from 'react'
import Table from '../../components/common/Table'
import Badge from '../../components/common/Badge'
import ErrorBanner from '../../components/common/ErrorBanner'
import { adminService, errorMessage } from '../../services/api'
import { date } from '../../utils/format'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    adminService.getUsers()
      .then(r => setUsers(r.data))
      .catch(err => setError(errorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async (user) => {
    const extra = user.role === 'vendor' ? ' Their shop and products will be removed too.' : ''
    if (!confirm(`Delete ${user.name}'s account?${extra} This can't be undone.`)) return
    setDeleting(user._id)
    setError('')
    try {
      await adminService.deleteUser(user._id)
      setUsers(us => us.filter(u => u._id !== user._id))
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setDeleting(null)
    }
  }

  const q = search.toLowerCase()
  const filtered = users.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: r => <Badge text={r.role} /> },
    { key: 'orders', label: 'Orders', render: r => r.role === 'customer' ? r.orders : '—' },
    { key: 'createdAt', label: 'Joined', render: r => date(r.createdAt) },
    {
      key: 'actions', label: 'Actions',
      render: r => r.role !== 'admin' ? (
        <button
          onClick={() => handleDelete(r)}
          disabled={deleting === r._id}
          className="text-xs px-3 py-1.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          {deleting === r._id ? 'Deleting...' : 'Delete'}
        </button>
      ) : <span className="text-xs text-gray-400">Protected</span>
    }
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Users</h1>
      <p className="text-gray-500 text-sm mb-6">Manage registered users</p>

      <ErrorBanner message={error} onRetry={users.length ? null : load} />

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
