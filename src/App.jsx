import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'

// Common
import ProtectedRoute from './components/common/ProtectedRoute'

// Layouts
import AdminLayout from './components/layout/AdminLayout'
import VendorLayout from './components/layout/VendorLayout'
import CustomerLayout from './components/layout/CustomerLayout'

// Auth pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminVendors from './pages/admin/AdminVendors'
import AdminUsers from './pages/admin/AdminUsers'
import AdminOrders from './pages/admin/AdminOrders'

// Vendor pages
import VendorDashboard from './pages/vendor/VendorDashboard'
import VendorShop from './pages/vendor/VendorShop'
import VendorProducts from './pages/vendor/VendorProducts'
import VendorOrders from './pages/vendor/VendorOrders'

// Customer pages
import CustomerHome from './pages/customer/CustomerHome'
import ShopDetails from './pages/customer/ShopDetails'
import CartPage from './pages/customer/CartPage'
import CustomerOrders from './pages/customer/CustomerOrders'
import CustomerProfile from './pages/customer/CustomerProfile'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Admin routes */}
            <Route path="/admin" element={
              <ProtectedRoute roles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="vendors" element={<AdminVendors />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="orders" element={<AdminOrders />} />
            </Route>

            {/* Vendor routes */}
            <Route path="/vendor" element={
              <ProtectedRoute roles={['vendor']}>
                <VendorLayout />
              </ProtectedRoute>
            }>
              <Route index element={<VendorDashboard />} />
              <Route path="shop" element={<VendorShop />} />
              <Route path="products" element={<VendorProducts />} />
              <Route path="orders" element={<VendorOrders />} />
            </Route>

            {/* Customer routes */}
            <Route path="/" element={
              <ProtectedRoute roles={['customer']}>
                <CustomerLayout />
              </ProtectedRoute>
            }>
              <Route index element={<CustomerHome />} />
              <Route path="shop/:id" element={<ShopDetails />} />
              <Route path="cart" element={<CartPage />} />
              <Route path="orders" element={<CustomerOrders />} />
              <Route path="profile" element={<CustomerProfile />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
