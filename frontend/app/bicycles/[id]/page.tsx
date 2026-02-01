'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import type { Bicycle, Review } from '@/types'

export default function BicycleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [bicycle, setBicycle] = useState<Bicycle | null>(null)
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
      fetchBicycle()
      fetchReviews()
    }
  }, [params.id])

  const fetchBicycle = async () => {
    try {
      const res = await api.get(`/bicycles/${params.id}`)
      setBicycle(res.data)
    } catch (error) {
      console.error('Error fetching bicycle:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchReviews = async () => {
    try {
      const res = await api.get(`/reviews?bicycle=${params.id}`)
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
    alert('Bicycle added to cart')
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    try {
      await api.post('/reviews', {
        bicycle: params.id,
        ...reviewForm,
      })
      setReviewForm({ rating: 5, title: '', comment: '' })
      setShowReviewForm(false)
      fetchReviews()
      fetchBicycle() // Refresh to update rating
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error adding review')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-xl">Loading...</div>
        </div>
      </div>
    )
  }

  if (!bicycle) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Bicycle not found</h1>
          <button
            onClick={() => router.push('/bicycles')}
            className="px-4 py-2 bg-primary-600 text-black rounded-lg"
          >
            Back to bicycles
          </button>
        </div>
      </div>
    )
  }

  const bicycleType = typeof bicycle.type === 'object' ? bicycle.type : null

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Bicycle Images */}
        <div>
          {bicycle.images && bicycle.images.length > 0 ? (
            <img
              src={bicycle.images[0]}
              alt={bicycle.name}
              className="w-full h-96 object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-400">No image</span>
            </div>
          )}
        </div>

        {/* Bicycle Info */}
        <div>
          {bicycleType && (
            <span className="text-sm text-gray-500">{bicycleType.name}</span>
          )}
          <h1 className="text-4xl font-bold mt-2 mb-4">{bicycle.name}</h1>

          {bicycle.ratingSummary && bicycle.ratingSummary.averageRating > 0 && (
            <div className="flex items-center mb-4">
              <span className="text-yellow-500 text-2xl">★</span>
              <span className="ml-2 text-lg">
                {bicycle.ratingSummary.averageRating.toFixed(1)} ({bicycle.ratingSummary.totalReviews} reviews)
              </span>
            </div>
          )}

          <div className="mb-6">
            {bicycle.discountPrice && bicycle.discountPrice > 0 ? (
              <div>
                <span className="text-4xl font-bold text-primary-600">
                  {bicycle.discountPrice.toFixed(2)} $
                </span>
                <span className="text-xl text-gray-500 line-through ml-3">
                  {bicycle.price.toFixed(2)} $
                </span>
              </div>
            ) : (
              <span className="text-4xl font-bold text-primary-600">
                {bicycle.price.toFixed(2)} $
              </span>
            )}
          </div>

          <p className="text-gray-700 mb-6">{bicycle.description}</p>

          {bicycle.specifications && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Specifications:</h3>
              <ul className="space-y-1 text-sm">
                {bicycle.specifications.brand && (
                  <li>Brand: {bicycle.specifications.brand}</li>
                )}
                {bicycle.specifications.frame?.material && (
                  <li>Frame material: {bicycle.specifications.frame.material}</li>
                )}
                {bicycle.specifications.frame?.size && (
                  <li>Frame size: {bicycle.specifications.frame.size}</li>
                )}
                {bicycle.specifications.wheels?.size && (
                  <li>Wheel size: {bicycle.specifications.wheels.size}</li>
                )}
                {bicycle.specifications.gears && (
                  <li>
                    Gears: {bicycle.specifications.gears.front || 0}x{bicycle.specifications.gears.rear || 0} 
                    ({bicycle.specifications.gears.total || 0} speeds)
                  </li>
                )}
                {bicycle.specifications.brakes?.type && (
                  <li>Brakes: {bicycle.specifications.brakes.type}</li>
                )}
                {bicycle.specifications.weight && (
                  <li>Weight: {bicycle.specifications.weight}</li>
                )}
                {bicycle.specifications.color && (
                  <li>Color: {bicycle.specifications.color}</li>
                )}
                {bicycle.specifications.suspension && (
                  <li>
                    Suspension: {
                      bicycle.specifications.suspension.type === 'hardtail' ? 'Hardtail' :
                      bicycle.specifications.suspension.type === 'full-suspension' ? 'Full suspension' :
                      'Rigid'
                    }
                  </li>
                )}
              </ul>
            </div>
          )}

          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <label className="font-medium">Quantity:</label>
              <input
                type="number"
                min="1"
                max={bicycle.stock}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-20 px-3 py-2 border border-gray-300 rounded-md"
              />
              <span className="text-gray-600">
                In stock: {bicycle.stock} pcs.
              </span>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={bicycle.stock === 0}
            className="w-full py-3 bg-primary-600 text-black rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {bicycle.stock === 0 ? 'Out of stock' : 'Add to cart'}
          </button>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Reviews</h2>
          {isAuthenticated && (
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="px-4 py-2 bg-primary-600 text-black rounded-lg hover:bg-primary-700"
            >
              {showReviewForm ? 'Cancel' : 'Write review'}
            </button>
          )}
        </div>

        {showReviewForm && (
          <form onSubmit={handleSubmitReview} className="bg-white p-6 rounded-lg shadow-md mb-6">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Rating</label>
              <select
                value={reviewForm.rating}
                onChange={(e) => setReviewForm({ ...reviewForm, rating: parseInt(e.target.value) })}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                {[5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={r}>
                    {r} star{r > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                value={reviewForm.title}
                onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Review title"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Comment</label>
              <textarea
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={4}
                placeholder="Your review"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-black rounded-lg hover:bg-primary-700"
            >
              Submit review
            </button>
          </form>
        )}

        <div className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-gray-500">No reviews yet</p>
          ) : (
            reviews.map((review) => (
              <div key={review._id} className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <span className="text-yellow-500">★</span>
                    <span className="ml-2 font-semibold">
                      {typeof review.user === 'object' ? review.user.username : 'User'}
                    </span>
                    {review.isVerified && (
                      <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Verified purchase
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

