import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // An expired/invalid session anywhere except the login & register forms sends the user to sign in.
    // (A wrong password on the login form is also a 401, and must show an error instead of reloading.)
    const isAuthForm = err.config?.url?.startsWith('/api/auth/login') || err.config?.url?.startsWith('/api/auth/register')
    if (err.response?.status === 401 && !isAuthForm) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (window.location.pathname !== '/login') window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

/** Turns an axios error into a message that can be shown to the user. */
export function errorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (err?.response?.data?.message) return err.response.data.message
  if (err?.request && !err?.response) return "Can't reach the server. Check your connection and try again."
  return fallback
}

export default api

// ---- Auth ----
export const authService = {
  login: (data) => api.post('/api/auth/login', data),
  register: (data) => api.post('/api/auth/register', data),
  me: () => api.get('/api/auth/me'),
  changePassword: (data) => api.put('/api/auth/password', data),
}

// ---- Admin ----
export const adminService = {
  getStats: () => api.get('/api/admin/stats'),
  getVendors: () => api.get('/api/admin/vendors'),
  approveVendor: (id) => api.put(`/api/admin/vendors/${id}/approve`),
  rejectVendor: (id) => api.put(`/api/admin/vendors/${id}/reject`),
  getUsers: () => api.get('/api/admin/users'),
  deleteUser: (id) => api.delete(`/api/admin/users/${id}`),
  getOrders: () => api.get('/api/admin/orders'),
}

// ---- Vendor ----
export const vendorService = {
  getStats: () => api.get('/api/vendor/stats'),
  createShop: (data) => api.post('/api/vendor/shop', data),
  getShop: () => api.get('/api/vendor/shop'),
  updateShop: (data) => api.put('/api/vendor/shop', data),
  getProducts: () => api.get('/api/vendor/products'),
  createProduct: (data) => api.post('/api/vendor/products', data),
  updateProduct: (id, data) => api.put(`/api/vendor/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/api/vendor/products/${id}`),
  getOrders: () => api.get('/api/vendor/orders'),
  updateOrderStatus: (id, status) => api.put(`/api/vendor/orders/${id}/status`, { status }),
}

// ---- Customer ----
export const customerService = {
  getShops: () => api.get('/api/shops'),
  getShop: (id) => api.get(`/api/shops/${id}`),
  getShopProducts: (id) => api.get(`/api/shops/${id}/products`),
  placeOrder: (data) => api.post('/api/orders', data),
  getOrders: () => api.get('/api/customer/orders'),
  cancelOrder: (id) => api.put(`/api/customer/orders/${id}/cancel`),
  getProfile: () => api.get('/api/customer/profile'),
  updateProfile: (data) => api.put('/api/customer/profile', data),
}
