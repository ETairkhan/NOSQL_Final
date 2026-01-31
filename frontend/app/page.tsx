'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import type { Bicycle, BicycleType } from '@/types'

export default function Home() {
  const [bicycles, setBicycles] = useState<Bicycle[]>([])
  const [types, setTypes] = useState<BicycleType[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<string>('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bicyclesRes, typesRes] = await Promise.all([
          api.get('/bicycles?limit=8'),
          api.get('/types')
        ])
        setBicycles(bicyclesRes.data.bicycles || [])
        setTypes(typesRes.data || [])
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    const fetchBicycles = async () => {
      try {
        const url = selectedType 
          ? `/bicycles?type=${selectedType}&limit=8`
          : '/bicycles?limit=8'
        const res = await api.get(url)
        setBicycles(res.data.bicycles || [])
      } catch (error) {
        console.error('Error fetching bicycles:', error)
      }
    }
    fetchBicycles()
  }, [selectedType])

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
          Добро пожаловать в наш магазин велосипедов
        </h1>
        <p className="text-gray-600 text-lg">
          Откройте для себя лучшие велосипеды для любого стиля езды
        </p>
      </div>

      {/* Types Filter */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Типы велосипедов</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedType('')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedType === ''
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Все велосипеды
          </button>
          {types.map((type) => (
            <button
              key={type._id}
              onClick={() => setSelectedType(type._id)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedType === type._id
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {type.name}
            </button>
          ))}
        </div>
      </div>

      {/* Bicycles Grid */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Популярные велосипеды</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    Нет изображения
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                  {bicycle.name}
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    {bicycle.discountPrice > 0 ? (
                      <div>
                        <span className="text-2xl font-bold text-primary-600">
                          {bicycle.discountPrice.toFixed(2)} ₽
                        </span>
                        <span className="text-sm text-gray-500 line-through ml-2">
                          {bicycle.price.toFixed(2)} ₽
                        </span>
                      </div>
                    ) : (
                      <span className="text-2xl font-bold text-primary-600">
                        {bicycle.price.toFixed(2)} ₽
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
                  <div className="mt-2 text-red-500 text-sm">Нет в наличии</div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="text-center">
        <Link
          href="/bicycles"
          className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Посмотреть все велосипеды
        </Link>
      </div>
    </div>
  )
}
