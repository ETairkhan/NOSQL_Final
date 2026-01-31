'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

export default function AdminPage() {
  const router = useRouter()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || user?.role !== 'admin') {
        router.push('/')
      } else {
        fetchStats()
      }
    }
  }, [isAuthenticated, user, authLoading])

  const fetchStats = async () => {
    try {
      const [overview, sales, products, categories] = await Promise.all([
        api.get('/stats/overview'),
        api.get('/stats/sales'),
        api.get('/stats/products?limit=5'),
        api.get('/stats/categories'),
      ])
      setStats({
        overview: overview.data,
        sales: sales.data,
        topProducts: products.data,
        categoryStats: categories.data,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-xl">Загрузка...</div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Админ-панель</h1>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Всего пользователей</h3>
          <p className="text-3xl font-bold text-primary-600">{stats.overview.users}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Товаров</h3>
          <p className="text-3xl font-bold text-primary-600">{stats.overview.products}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Заказов</h3>
          <p className="text-3xl font-bold text-primary-600">{stats.overview.orders}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Отзывов</h3>
          <p className="text-3xl font-bold text-primary-600">{stats.overview.reviews}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Ожидающих заказов</h3>
          <p className="text-3xl font-bold text-yellow-600">{stats.overview.pendingOrders}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Товаров с низким запасом</h3>
          <p className="text-3xl font-bold text-red-600">{stats.overview.lowStockProducts}</p>
        </div>
      </div>

      {/* Sales Stats */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-bold mb-4">Статистика продаж</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Всего заказов</p>
            <p className="text-2xl font-bold">{stats.sales.totalOrders || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Общая выручка</p>
            <p className="text-2xl font-bold text-green-600">
              {stats.sales.totalRevenue?.toFixed(2) || '0.00'} ₽
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Средний чек</p>
            <p className="text-2xl font-bold">
              {stats.sales.averageOrderValue?.toFixed(2) || '0.00'} ₽
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Товаров продано</p>
            <p className="text-2xl font-bold">{stats.sales.totalItemsSold || 0}</p>
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-bold mb-4">Топ продаваемых товаров</h2>
        {stats.topProducts && stats.topProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Товар</th>
                  <th className="text-right py-2">Продано</th>
                  <th className="text-right py-2">Выручка</th>
                </tr>
              </thead>
              <tbody>
                {stats.topProducts.map((product: any) => (
                  <tr key={product.productId} className="border-b">
                    <td className="py-2">{product.productName}</td>
                    <td className="text-right py-2">{product.totalSold}</td>
                    <td className="text-right py-2">{product.totalRevenue.toFixed(2)} ₽</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">Нет данных</p>
        )}
      </div>

      {/* Category Stats */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Статистика по категориям</h2>
        {stats.categoryStats && stats.categoryStats.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Категория</th>
                  <th className="text-right py-2">Продано</th>
                  <th className="text-right py-2">Выручка</th>
                </tr>
              </thead>
              <tbody>
                {stats.categoryStats.map((cat: any) => (
                  <tr key={cat.categoryId} className="border-b">
                    <td className="py-2">{cat.categoryName}</td>
                    <td className="text-right py-2">{cat.totalSold}</td>
                    <td className="text-right py-2">{cat.totalRevenue.toFixed(2)} ₽</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">Нет данных</p>
        )}
      </div>
    </div>
  )
}

