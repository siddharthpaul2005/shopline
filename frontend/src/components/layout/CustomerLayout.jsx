import React, { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'

export default function CustomerLayout() {
  const { user, logout } = useAuth()
  const { count } = useCart()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-display text-2xl text-green-600">ShopLine</Link>
          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/" end className={({isActive}) => `text-sm font-medium ${isActive ? 'text-green-600' : 'text-gray-600 hover:text-gray-900'}`}>Shops</NavLink>
            <NavLink to="/orders" className={({isActive}) => `text-sm font-medium ${isActive ? 'text-green-600' : 'text-gray-600 hover:text-gray-900'}`}>My Orders</NavLink>
            <NavLink to="/profile" className={({isActive}) => `text-sm font-medium ${isActive ? 'text-green-600' : 'text-gray-600 hover:text-gray-900'}`}>Profile</NavLink>
            <Link to="/cart" className="relative">
              <span className="text-2xl">🛒</span>
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{count}</span>
              )}
            </Link>
            <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
              <span className="text-sm text-gray-600">{user?.name}</span>
              <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-700">Logout</button>
            </div>
          </div>
          {/* Mobile */}
          <div className="flex md:hidden items-center gap-4">
            <Link to="/cart" className="relative">
              <span className="text-2xl">🛒</span>
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{count}</span>
              )}
            </Link>
            <button onClick={() => setMenuOpen(!menuOpen)} className="text-gray-600 text-xl">☰</button>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-3">
            <NavLink to="/" end onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-gray-700">Shops</NavLink>
            <NavLink to="/orders" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-gray-700">My Orders</NavLink>
            <NavLink to="/profile" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-gray-700">Profile</NavLink>
            <button onClick={handleLogout} className="block text-sm text-red-500">Logout</button>
          </div>
        )}
      </nav>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-white border-t border-gray-200 text-center py-4 text-sm text-gray-400">
        © {new Date().getFullYear()} ShopLine. All rights reserved.
      </footer>
    </div>
  )
}
