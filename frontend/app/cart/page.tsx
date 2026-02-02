'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { ordersAPI } from '@/lib/api'
import { Minus, Plus, Trash2, ShoppingBag, Bike } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

const CartPage = () => {
  const { state, updateQuantity, removeFromCart, clearCart } = useCart()
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleQuantityChange = (bicycleId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(bicycleId)
      return
    }
    updateQuantity(bicycleId, newQuantity)
  }

  const handleRemoveItem = (bicycleId: string) => {
    if (confirm('Are you sure you want to remove the item from the cart?')) {
      removeFromCart(bicycleId)
    }
  }

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (state.items.length === 0) return

    setIsProcessing(true)
    try {
      const orderData = {
        items: state.items.map(item => ({
          bicycle: item.bicycle._id,
          quantity: item.quantity
        })),
        shippingAddress: {
          street: '123 Main St',
          city: 'Default City',
          state: 'Default State',
          zipCode: '12345',
          country: 'Default Country'
        },
        paymentMethod: 'credit_card',
        discount: 0
      }

      const response = await ordersAPI.create(orderData)
      
      if (response.data._id) {
        clearCart()
        router.push(`/orders/${response.data._id}`)
      } else {
        throw new Error('Failed to create order')
      }
    } catch (error: any) {
      console.error('Failed to create order:', error)
      alert(error.response?.data?.message || 'Failed to place order. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  if (state.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <ShoppingBag size={64} className="mx-auto text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Your cart is empty
          </h1>
          <p className="text-gray-600 mb-8">
            Add bicycles to cart to place an order
          </p>
          <Link
            href="/bicycles"
            className="inline-flex items-center px-6 py-3 bg-primary-600 text-black rounded-lg hover:bg-primary-700 transition-colors"
          >
            Go to bicycles
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
              <div className="divide-y divide-gray-200">
                {state.items.map((item) => (
                  <div key={item.bicycle._id} className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {item.bicycle.images && item.bicycle.images.length > 0 ? (
                          <img
                            src={item.bicycle.images[0]}
                            alt={item.bicycle.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Bike size={32} className="text-gray-400" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {item.bicycle.name}
                            </h3>
                            <p className="text-gray-600 text-sm mb-2">
                              {typeof item.bicycle.type === 'object' ? item.bicycle.type.name : 'Type not specified'}
                            </p>
                            {item.bicycle.specifications?.color && (
                              <p className="text-gray-500 text-sm">
                                Color: {item.bicycle.specifications.color}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.bicycle._id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleQuantityChange(item.bicycle._id, item.quantity - 1)}
                              className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-300 hover:bg-gray-50"
                              disabled={item.quantity <= 1}
                            >
                              <Minus size={16} />
                            </button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <button
                              onClick={() => handleQuantityChange(item.bicycle._id, item.quantity + 1)}
                              className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-300 hover:bg-gray-50"
                            >
                              <Plus size={16} />
                            </button>
                          </div>

                          <div className="text-right">
                            <p className="text-lg font-semibold text-gray-900">
                              {(item.bicycle.price * item.quantity).toLocaleString()} $
                            </p>
                            <p className="text-sm text-gray-500">
                              {item.bicycle.price.toLocaleString()} $ per pc.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Items ({state.items.reduce((sum, item) => sum + item.quantity, 0)} pcs.)</span>
                  <span className="font-medium">{state.total.toLocaleString()} $</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery</span>
                  <span className="font-medium">0 $</span>
                </div>
                
                {state.total > 10000 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Large order discount</span>
                    <span>-{(state.total * 0.05).toLocaleString()} $</span>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total:</span>
                  <span className="text-2xl font-bold text-primary-600">
                    {state.total > 10000 
                      ? (state.total * 0.95).toLocaleString() 
                      : state.total.toLocaleString()} $
                  </span>
                </div>
                {state.total > 10000 && (
                  <p className="text-sm text-green-600 mt-1">
                    You saved {(state.total * 0.05).toLocaleString()} $
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  className="w-full px-6 py-3 bg-primary-600 text-black rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isProcessing ? 'Processing...' : 'Proceed to checkout'}
                </button>
                
                <Link
                  href="/bicycles"
                  className="block w-full text-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Continue shopping
                </Link>
                
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to clear the cart?')) {
                      clearCart()
                    }
                  }}
                  className="block w-full text-center px-6 py-3 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Clear cart
                </button>
              </div>

              <div className="mt-6 pt-6 border-t">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Secure payment</h3>
                <p className="text-xs text-gray-500 mb-3">
                  Your data is protected by SSL encryption
                </p>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">We accept:</span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">Visa</span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">MasterCard</span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">Mir</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CartPage