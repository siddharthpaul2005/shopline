# ShopLine - Grocery Marketplace Frontend

A complete multi-role grocery marketplace built with React, React Router DOM, Tailwind CSS, and Axios.

## Tech Stack

- **React 18** (functional components + hooks)
- **React Router DOM v6** (nested routes, protected routes)
- **Tailwind CSS** (via CDN for development)
- **Axios** (with JWT interceptor)
- **Context API** (Auth + Cart state)

---

## Project Structure

```
src/
├── components/
│   ├── common/
│   │   ├── ProtectedRoute.jsx   # Role-based route guard
│   │   ├── Table.jsx            # Reusable data table
│   │   ├── Modal.jsx            # Reusable modal dialog
│   │   ├── StatCard.jsx         # Dashboard stat card
│   │   └── Badge.jsx            # Status badge
│   └── layout/
│       ├── AdminLayout.jsx      # Sidebar layout for admin
│       ├── VendorLayout.jsx     # Sidebar layout for vendor
│       └── CustomerLayout.jsx   # Navbar layout for customers
├── context/
│   ├── AuthContext.jsx          # JWT auth state
│   └── CartContext.jsx          # Shopping cart state
├── pages/
│   ├── auth/
│   │   ├── Login.jsx
│   │   └── Register.jsx         # With role selection
│   ├── admin/
│   │   ├── AdminDashboard.jsx   # Stats + quick actions
│   │   ├── AdminVendors.jsx     # Approve/reject vendors
│   │   ├── AdminUsers.jsx       # User management
│   │   └── AdminOrders.jsx      # All orders overview
│   ├── vendor/
│   │   ├── VendorDashboard.jsx  # Vendor stats
│   │   ├── VendorShop.jsx       # Shop setup form
│   │   ├── VendorProducts.jsx   # CRUD with modal
│   │   └── VendorOrders.jsx     # Status update dropdown
│   └── customer/
│       ├── CustomerHome.jsx     # Shop listing + search
│       ├── ShopDetails.jsx      # Product grid + add to cart
│       ├── CartPage.jsx         # Grouped by vendor + checkout
│       ├── CustomerOrders.jsx   # Order history + tracker
│       └── CustomerProfile.jsx  # Profile edit
└── services/
    └── api.js                   # Axios instance + all service methods
```

---

## Getting Started

### Install dependencies

```bash
cd grocery-marketplace
npm install
```

### Run development server

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Roles & Routes

| Role     | Routes                                       |
|----------|----------------------------------------------|
| Admin    | `/admin`, `/admin/vendors`, `/admin/users`, `/admin/orders` |
| Vendor   | `/vendor`, `/vendor/shop`, `/vendor/products`, `/vendor/orders` |
| Customer | `/`, `/shop/:id`, `/cart`, `/orders`, `/profile` |

---

## Authentication Flow

1. JWT token stored in `localStorage`
2. Axios interceptor attaches `Authorization: Bearer <token>` to every request
3. 401 responses auto-redirect to `/login`
4. `ProtectedRoute` checks role before rendering pages
5. After login, user is redirected based on role:
   - `admin` → `/admin`
   - `vendor` → `/vendor`
   - `customer` → `/`

---

## API Integration

All API calls use placeholder URLs. Connect to your backend by setting:

```env
VITE_API_URL=http://your-backend-url.com
```

### API Endpoints Expected

#### Auth
- `POST /api/auth/login` → `{ token, user: { _id, name, email, role } }`
- `POST /api/auth/register` → `{ token, user }`

#### Admin
- `GET /api/admin/stats`
- `GET /api/admin/vendors`
- `PUT /api/admin/vendors/:id/approve`
- `PUT /api/admin/vendors/:id/reject`
- `GET /api/admin/users`
- `DELETE /api/admin/users/:id`
- `GET /api/admin/orders`

#### Vendor
- `GET /api/vendor/stats`
- `GET /api/vendor/shop` + `POST /api/vendor/shop` + `PUT /api/vendor/shop`
- `GET /api/vendor/products` + `POST` + `PUT /:id` + `DELETE /:id`
- `GET /api/vendor/orders`
- `PUT /api/vendor/orders/:id/status`

#### Customer
- `GET /api/shops` + `GET /api/shops/:id` + `GET /api/shops/:id/products`
- `POST /api/orders`
- `GET /api/customer/orders`
- `GET /api/customer/profile` + `PUT /api/customer/profile`

---

## Features

- ✅ Role-based protected routing
- ✅ JWT stored in localStorage + axios interceptor
- ✅ Admin: vendor approve/reject, user management, orders overview
- ✅ Vendor: shop setup, product CRUD with modal, order status updates
- ✅ Customer: shop discovery, product browsing, cart (grouped by vendor), checkout, order tracking
- ✅ Responsive sidebar layouts for admin/vendor
- ✅ Navbar layout for customer with cart badge
- ✅ Reusable Table, Modal, StatCard, Badge components
- ✅ Mock data fallback (works without backend)
- ✅ Cart persisted in localStorage
