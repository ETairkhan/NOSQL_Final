'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import type { Product, Review } from '@/types'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [product, setProduct] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    comment: '',
  })
  const [showReviewForm, setShowReviewForm] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchProduct()
      fetchReviews()
    }
  }, [params.id])

  const fetchProduct = async () => {
    try {
      const res = await api.get(`/products/${params.id}`)
      setProduct(res.data)
    } catch (error) {
      console.error('Error fetching product:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchReviews = async () => {
    try {
      const res = await api.get(`/reviews?product=${params.id}`)
      setReviews(res.data)
    } catch (error) {
      console.error('Error fetching reviews:', error)
    }
  }

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    // Cart functionality would go here
    alert('Товар добавлен в корзину')
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    try {
      await api.post('/reviews', {
        product: params.id,
        ...reviewForm,
      })
      setReviewForm({ rating: 5, title: '', comment: '' })
      setShowReviewForm(false)
      fetchReviews()
      fetchProduct() // Refresh to update rating
    } catch (error: any) {
      alert(error.response?.data?.message || 'Ошибка при добавлении отзыва')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-xl">Загрузка...</div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Товар не найден</h1>
          <button
            onClick={() => router.push('/products')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg"
          >
            Вернуться к товарам
          </button>
        </div>
      </div>
    )
  }

  const category = typeof product.category === 'object' ? product.category : null

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Product Images */}
        <div>
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-96 object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-400">Нет изображения</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          {category && (
            <span className="text-sm text-gray-500">{category.name}</span>
          )}
          <h1 className="text-4xl font-bold mt-2 mb-4">{product.name}</h1>

          {product.ratingSummary && product.ratingSummary.averageRating > 0 && (
            <div className="flex items-center mb-4">
              <span className="text-yellow-500 text-2xl">★</span>
              <span className="ml-2 text-lg">
                {product.ratingSummary.averageRating.toFixed(1)} ({product.ratingSummary.totalReviews} отзывов)
              </span>
            </div>
          )}

          <div className="mb-6">
            {product.discountPrice && product.discountPrice > 0 ? (
              <div>
                <span className="text-4xl font-bold text-primary-600">
                  {product.discountPrice.toFixed(2)} ₽
                </span>
                <span className="text-xl text-gray-500 line-through ml-3">
                  {product.price.toFixed(2)} ₽
                </span>
              </div>
            ) : (
              <span className="text-4xl font-bold text-primary-600">
                {product.price.toFixed(2)} ₽
              </span>
            )}
          </div>

          <p className="text-gray-700 mb-6">{product.description}</p>

          {product.specifications && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Характеристики:</h3>
              <ul className="space-y-1 text-sm">
                {product.specifications.brand && (
                  <li>Бренд: {product.specifications.brand}</li>
                )}
                {product.specifications.color && (
                  <li>Цвет: {product.specifications.color}</li>
                )}
                {product.specifications.material && (
                  <li>Материал: {product.specifications.material}</li>
                )}
              </ul>
            </div>
          )}

          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <label className="font-medium">Количество:</label>
              <input
                type="number"
                min="1"
                max={product.stock}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-20 px-3 py-2 border border-gray-300 rounded-md"
              />
              <span className="text-gray-600">
                В наличии: {product.stock} шт.
              </span>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {product.stock === 0 ? 'Нет в наличии' : 'Добавить в корзину'}
          </button>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Отзывы</h2>
          {isAuthenticated && (
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              {showReviewForm ? 'Отменить' : 'Написать отзыв'}
            </button>
          )}
        </div>

        {showReviewForm && (
          <form onSubmit={handleSubmitReview} className="bg-white p-6 rounded-lg shadow-md mb-6">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Рейтинг</label>
              <select
                value={reviewForm.rating}
                onChange={(e) => setReviewForm({ ...reviewForm, rating: parseInt(e.target.value) })}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                {[5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={r}>
                    {r} звезд{r > 1 ? 'ы' : 'а'}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Заголовок</label>
              <input
                type="text"
                value={reviewForm.title}
                onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Заголовок отзыва"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Комментарий</label>
              <textarea
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={4}
                placeholder="Ваш отзыв"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Отправить отзыв
            </button>
          </form>
        )}

        <div className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-gray-500">Пока нет отзывов</p>
          ) : (
            reviews.map((review) => (
              <div key={review._id} className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <span className="text-yellow-500">★</span>
                    <span className="ml-2 font-semibold">
                      {typeof review.user === 'object' ? review.user.username : 'Пользователь'}
                    </span>
                    {review.isVerified && (
                      <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Проверенная покупка
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString('ru-RU')}
                  </span>
                </div>
                {review.title && (
                  <h4 className="font-semibold mb-2">{review.title}</h4>
                )}
                <p className="text-gray-700">{review.comment}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

