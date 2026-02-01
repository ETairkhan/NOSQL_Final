'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { statsAPI } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { StatsOverview, SalesStats, TopBicycle, TypeStats } from '@/types'
import Link from 'next/link'
import { Bike, Package, Users, Star, BarChart3, Settings, AlertTriangle } from 'lucide-react'

export default function AdminPage() {
  const router = useRouter()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [overview, setOverview] = useState<StatsOverview | null>(null)
  const [sales, setSales] = useState<SalesStats | null>(null)
  const [topBicycles, setTopBicycles] = useState<TopBicycle[]>([])
  const [typeStats, setTypeStats] = useState<TypeStats[]>([])
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
      const [
        { data: overviewData },
        { data: salesData },
        { data: topBicyclesData },
        { data: typeStatsData }
      ] = await Promise.all([
        statsAPI.getOverview(),
        statsAPI.getSales(),
        statsAPI.getTopBicycles(),
        statsAPI.getTypeStats()
      ])
      setOverview(overviewData)
      setSales(salesData)
      setTopBicycles(topBicyclesData)
      setTypeStats(typeStatsData)
    } catch (error) {
      console.error('Error fetching stats:', error)
      alert('Failed to load statistics')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-xl">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Admin Panel</h1>

      {/* Admin Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        <Link
          href="/admin/bicycle-types"
          className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-blue-500"
        >
          <div className="flex items-center">
            <Bike className="text-blue-500 mr-3" size={24} />
            <div>
              <h3 className="font-semibold text-gray-900">Bicycle Types</h3>
              <p className="text-sm text-gray-600">Type management</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/bicycles"
          className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-green-500"
        >
          <div className="flex items-center">
            <Settings className="text-green-500 mr-3" size={24} />
            <div>
              <h3 className="font-semibold text-gray-900">Bicycles</h3>
              <p className="text-sm text-gray-600">Product management</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/orders"
          className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-orange-500"
        >
          <div className="flex items-center">
            <Package className="text-orange-500 mr-3" size={24} />
            <div>
              <h3 className="font-semibold text-gray-900">Orders</h3>
              <p className="text-sm text-gray-600">Order management</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/reviews"
          className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-yellow-500"
        >
          <div className="flex items-center">
            <Star className="text-yellow-500 mr-3" size={24} />
            <div>
              <h3 className="font-semibold text-gray-900">Reviews</h3>
              <p className="text-sm text-gray-600">Review moderation</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/stats"
          className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-purple-500"
        >
          <div className="flex items-center">
            <BarChart3 className="text-purple-500 mr-3" size={24} />
            <div>
              <h3 className="font-semibold text-gray-900">Statistics</h3>
              <p className="text-sm text-gray-600">Detailed statistics</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Overview Stats */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <Users className="text-blue-500 mr-3" size={24} />
              <div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Users</h3>
                <p className="text-3xl font-bold text-blue-600">{overview.users}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <Bike className="text-green-500 mr-3" size={24} />
              <div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Bicycles</h3>
                <p className="text-3xl font-bold text-green-600">{overview.bicycles}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <Package className="text-orange-500 mr-3" size={24} />
              <div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Orders</h3>
                <p className="text-3xl font-bold text-orange-600">{overview.orders}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <Star className="text-yellow-500 mr-3" size={24} />
              <div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Reviews</h3>
                <p className="text-3xl font-bold text-yellow-600">{overview.reviews}</p>
              </div>
            </div>
          </div>
          {overview.pendingOrders !== undefined && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <Package className="text-yellow-600 mr-3" size={24} />
                <div>
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Pending orders</h3>
                  <p className="text-3xl font-bold text-yellow-600">{overview.pendingOrders}</p>
                </div>
              </div>
            </div>
          )}
          {overview.lowStockBicycles !== undefined && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <AlertTriangle className="text-red-500 mr-3" size={24} />
                <div>
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Low stock</h3>
                  <p className="text-3xl font-bold text-red-600">{overview.lowStockBicycles}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sales Stats */}
      {sales && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-bold mb-4">Sales statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total orders</p>
              <p className="text-2xl font-bold">{sales.totalOrders}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total revenue</p>
              <p className="text-2xl font-bold text-green-600">
                {sales.totalRevenue.toLocaleString()} $
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Average order value</p>
              <p className="text-2xl font-bold">
                {sales.averageOrderValue.toLocaleString()} $
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Items sold</p>
              <p className="text-2xl font-bold">{sales.totalItemsSold}</p>
            </div>
          </div>
        </div>
      )}

      {/* Top Bicycles */}
      {topBicycles.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-bold mb-4">Top selling bicycles</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Rank</th>
                  <th className="text-left py-2 px-4">Bicycle</th>
                  <th className="text-right py-2 px-4">Sold</th>
                  <th className="text-right py-2 px-4">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topBicycles.map((bicycle, index) => (
                  <tr key={bicycle.bicycleId} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${index < 3 ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-800'}`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-2 px-4">{bicycle.bicycleName}</td>
                    <td className="text-right py-2 px-4">{bicycle.totalSold}</td>
                    <td className="text-right py-2 px-4 font-semibold text-green-600">
                      {bicycle.totalRevenue.toLocaleString()} $
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Type Stats */}
      {typeStats.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Statistics by bicycle types</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Type</th>
                  <th className="text-right py-2 px-4">Sold</th>
                  <th className="text-right py-2 px-4">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {typeStats.map((type) => (
                  <tr key={type.typeId} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">{type.typeName}</td>
                    <td className="text-right py-2 px-4">{type.totalSold}</td>
                    <td className="text-right py-2 px-4 font-semibold text-green-600">
                      {type.totalRevenue.toLocaleString()} $
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(!overview && !sales && topBicycles.length === 0 && typeStats.length === 0) && (
        <div className="text-center py-12">
          <BarChart3 size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Statistics unavailable
          </h3>
          <p className="text-gray-600">
            No data to display statistics
          </p>
        </div>
      )}
    </div>
  )
}