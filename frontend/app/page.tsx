'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import type { Product, Category } from '@/types'

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          api.get('/products?limit=8'),
          api.get('/categories')
        ])
        setProducts(productsRes.data.products || [])
        setCategories(categoriesRes.data || [])
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const url = selectedCategory 
          ? `/products?category=${selectedCategory}&limit=8`
          : '/products?limit=8'
        const res = await api.get(url)
        setProducts(res.data.products || [])
      } catch (error) {
        console.error('Error fetching products:', error)
      }
    }
    fetchProducts()
  }, [selectedCategory])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Добро пожаловать в наш магазин
        </h1>
        <p className="text-gray-600 text-lg">
          Откройте для себя лучшие товары по выгодным ценам
        </p>
      </div>

      {/* Categories Filter */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Категории</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedCategory === ''
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Все товары
          </button>
          {categories.map((category) => (
            <button
              key={category._id}
              onClick={() => setSelectedCategory(category._id)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedCategory === category._id
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Популярные товары</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link
              key={product._id}
              href={`/products/${product._id}`}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 flex items-center justify-center text-gray-400">
                    Нет изображения
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                  {product.name}
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    {product.discountPrice > 0 ? (
                      <div>
                        <span className="text-2xl font-bold text-primary-600">
                          {product.discountPrice.toFixed(2)} ₽
                        </span>
                        <span className="text-sm text-gray-500 line-through ml-2">
                          {product.price.toFixed(2)} ₽
                        </span>
                      </div>
                    ) : (
                      <span className="text-2xl font-bold text-primary-600">
                        {product.price.toFixed(2)} ₽
                      </span>
                    )}
                  </div>
                  {product.ratingSummary && product.ratingSummary.averageRating > 0 && (
                    <div className="flex items-center">
                      <span className="text-yellow-500">★</span>
                      <span className="ml-1 text-sm">
                        {product.ratingSummary.averageRating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
                {product.stock === 0 && (
                  <div className="mt-2 text-red-500 text-sm">Нет в наличии</div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="text-center">
        <Link
          href="/products"
          className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Посмотреть все товары
        </Link>
      </div>
    </div>
  )
}

