'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { statsAPI } from '@/lib/api'
import { StatsOverview, SalesStats, TopBicycle, TypeStats, ReviewsStats } from '@/types'
import { Users, Bike, Package, Star, TrendingUp, DollarSign, ShoppingCart } from 'lucide-react'

const StatsAdminPage = () => {
  const { user } = useAuth()
  const [overview, setOverview] = useState<StatsOverview | null>(null)
  const [sales, setSales] = useState<SalesStats | null>(null)
  const [topBicycles, setTopBicycles] = useState<TopBicycle[]>([])
  const [typeStats, setTypeStats] = useState<TypeStats[]>([])
  const [reviewsStats, setReviewsStats] = useState<ReviewsStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role !== 'admin') return
    loadStats()
  }, [user])

  const loadStats = async () => {
    try {
      const [
        { data: overviewData },
        { data: salesData },
        { data: topBicyclesData },
        { data: typeStatsData },
        { data: reviewsStatsData }
      ] = await Promise.all([
        statsAPI.getOverview(),
        statsAPI.getSalesStats(),
        statsAPI.getTopBicycles(),
        statsAPI.getTypeStats(),
        statsAPI.getReviewsStats()
      ])

      setOverview(overviewData)
      setSales(salesData)
      setTopBicycles(topBicyclesData)
      setTypeStats(typeStatsData)
      setReviewsStats(reviewsStatsData)
    } catch (error) {
      console.error('Failed to load stats:', error)
      alert('Failed to load statistics')
    } finally {
      setLoading(false)
    }
  }

  if (user?.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access denied</h1>
          <p className="text-gray-600 mt-2">You do not have permission to view this page</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading statistics...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Store statistics</h1>

      {/* Overview Stats */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <Users className="text-blue-500 mr-3" size={24} />
              <div>
                <p className="text-sm text-gray-600">Users</p>
                <p className="text-2xl font-bold text-gray-900">{overview.users}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <Bike className="text-green-500 mr-3" size={24} />
              <div>
                <p className="text-sm text-gray-600">Bicycles</p>
                <p className="text-2xl font-bold text-gray-900">{overview.bicycles}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <Package className="text-orange-500 mr-3" size={24} />
              <div>
                <p className="text-sm text-gray-600">Orders</p>
                <p className="text-2xl font-bold text-gray-900">{overview.orders}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <Star className="text-yellow-500 mr-3" size={24} />
              <div>
                <p className="text-sm text-gray-600">Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{overview.reviews}</p>
              </div>
            </div>
          </div>
          {overview.pendingOrders !== undefined && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <Package className="text-yellow-500 mr-3" size={24} />
                <div>
                  <p className="text-sm text-gray-600">Pending orders</p>
                  <p className="text-2xl font-bold text-gray-900">{overview.pendingOrders}</p>
                </div>
              </div>
            </div>
          )}
          {overview.lowStockBicycles !== undefined && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <Bike className="text-red-500 mr-3" size={24} />
                <div>
                  <p className="text-sm text-gray-600">Low stock</p>
                  <p className="text-2xl font-bold text-gray-900">{overview.lowStockBicycles}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sales Stats */}
      {sales && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <DollarSign className="text-green-500 mr-3" size={24} />
              <div>
                <p className="text-sm text-gray-600">Total revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {sales.totalRevenue.toLocaleString()} $
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <ShoppingCart className="text-blue-500 mr-3" size={24} />
              <div>
                <p className="text-sm text-gray-600">Average order value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {sales.averageOrderValue.toLocaleString()} $
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <TrendingUp className="text-purple-500 mr-3" size={24} />
              <div>
                <p className="text-sm text-gray-600">Items sold</p>
                <p className="text-2xl font-bold text-gray-900">{sales.totalItemsSold}</p>
              </div>
            </div>
          </div>
          {sales.totalOrders !== undefined && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <Package className="text-orange-500 mr-3" size={24} />
                <div>
                  <p className="text-sm text-gray-600">Total orders</p>
                  <p className="text-2xl font-bold text-gray-900">{sales.totalOrders}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Bicycles */}
        {topBicycles.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Top bicycles</h2>
            <div className="space-y-3">
              {topBicycles.map((bicycle, index) => (
                <div key={bicycle.bicycleId} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center">
                    <span className="text-lg font-bold text-gray-500 mr-3">#{index + 1}</span>
                    <div>
                      <p className="font-medium text-gray-900">{bicycle.bicycleName}</p>
                      <p className="text-sm text-gray-600">Sold: {bicycle.totalSold} pcs.</p>
                    </div>
                  </div>
                  <p className="font-semibold text-green-600">
                    {bicycle.totalRevenue.toLocaleString()} $
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Type Stats */}
        {typeStats.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Type statistics</h2>
            <div className="space-y-3">
              {typeStats.map((type, index) => (
                <div key={type.typeId} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center">
                    <span className="text-lg font-bold text-gray-500 mr-3">#{index + 1}</span>
                    <div>
                      <p className="font-medium text-gray-900">{type.typeName}</p>
                      <p className="text-sm text-gray-600">Sold: {type.totalSold} pcs.</p>
                    </div>
                  </div>
                  <p className="font-semibold text-green-600">
                    {type.totalRevenue.toLocaleString()} $
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reviews Stats */}
      {reviewsStats && (
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Reviews statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center mb-4">
                <Star className="text-yellow-500 mr-2" size={20} />
                <span className="text-lg font-semibold">
                  Average rating: {reviewsStats.averageRating.toFixed(1)}/5
                </span>
              </div>
              <p className="text-gray-600">Total reviews: {reviewsStats.totalReviews}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Rating distribution</h3>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const ratingObj = reviewsStats.ratingDistribution.find(
                    (item: any) => item.rating === rating
                  );
                  const ratingCount = ratingObj ? ratingObj.count : 0;
                  const percentage = reviewsStats.totalReviews > 0 
                    ? (ratingCount / reviewsStats.totalReviews) * 100 
                    : 0;
                  
                  return (
                    <div key={rating} className="flex items-center">
                      <span className="w-8 text-sm">{rating}★</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2 mx-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-8">
                        {ratingCount}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StatsAdminPage