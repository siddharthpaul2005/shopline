import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)

function readSavedCart() {
  try {
    const saved = JSON.parse(localStorage.getItem('cart'))
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [items, setItems] = useState(readSavedCart)

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items))
  }, [items])

  // Empty the cart when someone signs out, so the next person on this browser doesn't inherit it.
  const previousUser = useRef(user)
  useEffect(() => {
    if (previousUser.current && !user) setItems([])
    previousUser.current = user
  }, [user])

  const addItem = (product, shop) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === product._id)
      if (existing) {
        return prev.map(i => i.productId === product._id
          ? { ...i, qty: Math.min(i.qty + 1, product.stock), stock: product.stock }
          : i)
      }
      return [...prev, { productId: product._id, name: product.name, price: Number(product.price), image: product.image, stock: product.stock, qty: 1, shopId: shop._id, shopName: shop.name }]
    })
  }

  const removeItem = (productId) => {
    setItems(prev => prev.filter(i => i.productId !== productId))
  }

  const updateQty = (productId, qty) => {
    if (qty < 1) return removeItem(productId)
    setItems(prev => prev.map(i => i.productId === productId
      ? { ...i, qty: i.stock != null ? Math.min(qty, i.stock) : qty }
      : i))
  }

  const clearCart = () => setItems([])

  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0)
  const count = items.reduce((sum, i) => sum + i.qty, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, total, count }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
