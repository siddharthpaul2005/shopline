import React, { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const links = [
  { to: '/vendor', label: 'Dashboard', icon: '▦', end: true },
  { to: '/vendor/shop', label: 'My Shop', icon: '🏪' },
  { to: '/vendor/products', label: 'Products', icon: '🥦' },
  { to: '/vendor/orders', label: 'Orders', icon: '📦' },
]

export default function VendorLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  const Sidebar = () => (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="px-6 py-5 border-b border-gray-100">
        <span className="font-display text-xl text-green-600">FreshMart</span>
        <p className="text-xs text-gray-400 mt-0.5">Vendor Panel</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <span>{l.icon}</span> {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-gray-100">
        <div className="px-3 py-2 mb-2">
          <p className="text-sm font-medium text-gray-700">{user?.name}</p>
          <p className="text-xs text-gray-400">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
        >
          <span>⬅</span> Logout
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <div className="hidden md:flex flex-col">
        <Sidebar />
      </div>
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="absolute inset-0 bg-black bg-opacity-30" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex flex-col w-60">
            <Sidebar />
          </div>
        </div>
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4 md:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600">☰</button>
          <span className="font-display text-lg text-green-600">FreshMart Vendor</span>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
