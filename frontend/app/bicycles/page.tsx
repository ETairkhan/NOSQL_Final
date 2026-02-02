'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import type { Bicycle, BicycleType } from '@/types'

export default function BicyclesPage() {
  const [bicycles, setBicycles] = useState<Bicycle[]>([])
  const [types, setTypes] = useState<BicycleType[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    type: '',
    minPrice: '',
    maxPrice: '',
    sort: '-createdAt',
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  })

  useEffect(() => {
    fetchTypes()
  }, [])

  useEffect(() => {
    fetchBicycles()
  }, [filters, pagination.page])

  const fetchTypes = async () => {
    try {
      const res = await api.get('/types')
      setTypes(res.data)
    } catch (error) {
      console.error('Error fetching types:', error)
    }
  }

  const fetchBicycles = async () => {
    setLoading(true)
    try {
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
        sort: filters.sort,
      }
      if (filters.type) params.type = filters.type
      if (filters.minPrice) params.minPrice = filters.minPrice
      if (filters.maxPrice) params.maxPrice = filters.maxPrice

      const res = await api.get('/bicycles', { params })
      setBicycles(res.data.bicycles || [])
      setPagination({
        ...pagination,
        total: res.data.pagination?.total || 0,
        pages: res.data.pagination?.pages || 0,
      })
    } catch (error) {
      console.error('Error fetching bicycles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (name: string, value: string) => {
    setFilters({ ...filters, [name]: value })
    setPagination({ ...pagination, page: 1 })
  }

  if (loading && bicycles.length === 0) {
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
      <h1 className="text-4xl font-bold text-gray-900 mb-8">All bicycles</h1>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className="w-full md:w-64">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Filters</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bicycle type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500"
                >
                  <option value="">All types</option>
                  {types.map((type) => (
                    <option key={type._id} value={type._id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price from
                </label>
                <input
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price to
                </label>
                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500"
                  placeholder="100000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sorting
                </label>
                <select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500"
                >
                  <option value="-createdAt">Newest first</option>
                  <option value="price">Price: low to high</option>
                  <option value="-price">Price: high to low</option>
                  <option value="-ratingSummary.averageRating">By rating</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Bicycles Grid */}
        <div className="flex-1">
          {bicycles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No bicycles found</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {bicycles.map((bicycle) => (
                  <Link
                    key={bicycle._id}
                    href={`/bicycles/${bicycle._id}`}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                      {bicycle.images && bicycle.images.length > 0 ? (
                        <img
                          src={bicycle.images[0]}
                          alt={bicycle.name}
                          className="w-full h-48 object-cover"
                        />
                      ) : (
                        <div className="w-full h-48 flex items-center justify-center text-gray-400">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                        {bicycle.name}
                      </h3>
                      <div className="flex items-center justify-between">
                        <div>
                          {bicycle.discountPrice && bicycle.discountPrice > 0 ? (
                            <div>
                              <span className="text-2xl font-bold text-primary-600">
                                {bicycle.discountPrice.toFixed(2)} $
                              </span>
                              <span className="text-sm text-gray-500 line-through ml-2">
                                {bicycle.price.toFixed(2)} $
                              </span>
                            </div>
                          ) : (
                            <span className="text-2xl font-bold text-primary-600">
                              {bicycle.price.toFixed(2)} $
                            </span>
                          )}
                        </div>
                        {bicycle.ratingSummary && bicycle.ratingSummary.averageRating > 0 && (
                          <div className="flex items-center">
                            <span className="text-yellow-500">★</span>
                            <span className="ml-1 text-sm">
                              {bicycle.ratingSummary.averageRating.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                      {bicycle.stock === 0 && (
                        <div className="mt-2 text-red-500 text-sm">Out of stock</div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <span className="px-4 py-2">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    disabled={pagination.page === pagination.pages}
                    className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

