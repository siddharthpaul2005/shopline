import React, { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('cart')
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items))
  }, [items])

  const addItem = (product, shop) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === product._id)
      if (existing) {
        return prev.map(i => i.productId === product._id ? { ...i, qty: i.qty + 1 } : i)
      }
      return [...prev, { productId: product._id, name: product.name, price: product.price, image: product.image, qty: 1, shopId: shop._id, shopName: shop.name }]
    })
  }

  const removeItem = (productId) => {
    setItems(prev => prev.filter(i => i.productId !== productId))
  }

  const updateQty = (productId, qty) => {
    if (qty < 1) return removeItem(productId)
    setItems(prev => prev.map(i => i.productId === productId ? { ...i, qty } : i))
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
