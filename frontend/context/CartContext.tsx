'use client'

import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { Bicycle } from '../types'

export interface CartItem {
  bicycle: Bicycle
  quantity: number
}

export interface CartState {
  items: CartItem[]
  total: number
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: { bicycle: Bicycle; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: { bicycleId: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { bicycleId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] }

const CartContext = createContext<{
  state: CartState
  dispatch: React.Dispatch<CartAction>
  addToCart: (bicycle: Bicycle, quantity?: number) => void
  removeFromCart: (bicycleId: string) => void
  updateQuantity: (bicycleId: string, quantity: number) => void
  clearCart: () => void
} | null>(null)

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(
        item => item.bicycle._id === action.payload.bicycle._id
      )

      let newItems: CartItem[]
      if (existingItem) {
        newItems = state.items.map(item =>
          item.bicycle._id === action.payload.bicycle._id
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        )
      } else {
        newItems = [...state.items, action.payload]
      }

      const total = newItems.reduce(
        (sum, item) => sum + item.bicycle.price * item.quantity,
        0
      )

      return { items: newItems, total }
    }

    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(
        item => item.bicycle._id !== action.payload.bicycleId
      )
      const total = newItems.reduce(
        (sum, item) => sum + item.bicycle.price * item.quantity,
        0
      )
      return { items: newItems, total }
    }

    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        return cartReducer(state, {
          type: 'REMOVE_ITEM',
          payload: { bicycleId: action.payload.bicycleId }
        })
      }

      const newItems = state.items.map(item =>
        item.bicycle._id === action.payload.bicycleId
          ? { ...item, quantity: action.payload.quantity }
          : item
      )
      const total = newItems.reduce(
        (sum, item) => sum + item.bicycle.price * item.quantity,
        0
      )
      return { items: newItems, total }
    }

    case 'CLEAR_CART':
      return { items: [], total: 0 }

    case 'LOAD_CART': {
      const total = action.payload.reduce(
        (sum, item) => sum + item.bicycle.price * item.quantity,
        0
      )
      return { items: action.payload, total }
    }

    default:
      return state
  }
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [], total: 0 })

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      try {
        const cartItems: CartItem[] = JSON.parse(savedCart)
        dispatch({ type: 'LOAD_CART', payload: cartItems })
      } catch (error) {
        console.error('Failed to load cart from localStorage:', error)
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state.items))
  }, [state.items])

  const addToCart = (bicycle: Bicycle, quantity: number = 1) => {
    dispatch({ type: 'ADD_ITEM', payload: { bicycle, quantity } })
  }

  const removeFromCart = (bicycleId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { bicycleId } })
  }

  const updateQuantity = (bicycleId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { bicycleId, quantity } })
  }

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' })
  }

  return (
    <CartContext.Provider
      value={{
        state,
        dispatch,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}