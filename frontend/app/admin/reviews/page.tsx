'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { reviewsAPI } from '@/lib/api'
import { Review } from '@/types'
import { Star, Eye, Trash2, CheckCircle, XCircle, ThumbsUp } from 'lucide-react'

const ReviewsAdminPage = () => {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)

  useEffect(() => {
    if (user?.role !== 'admin') return
    loadReviews()
  }, [user])

  const loadReviews = async () => {
    try {
      const response = await reviewsAPI.getAllReviews()
      setReviews(response.data)
    } catch (error) {
      console.error('Failed to load reviews:', error)
      alert('Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return
    try {
      await reviewsAPI.deleteReview(id)
      loadReviews()
    } catch (error) {
      console.error('Failed to delete review:', error)
      alert('Failed to delete review')
    }
  }

  const toggleVerified = async (id: string, isVerified: boolean) => {
    try {
      await reviewsAPI.update(id, { isVerified: !isVerified })
      loadReviews()
    } catch (error) {
      console.error('Failed to update review:', error)
      alert('Failed to update review status')
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        className={`${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ))
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
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Review management</h1>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bicycle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Helpful
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reviews.map((review) => (
                <tr key={review._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {typeof review.bicycle === 'object' ? review.bicycle.name : 'Bicycle'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {typeof review.user === 'object' ? review.user.username : 'User'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex">
                      {renderStars(review.rating)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString('en-US')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleVerified(review._id, review.isVerified)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${review.isVerified ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'}`}
                    >
                      {review.isVerified ? (
                        <>
                          <CheckCircle size={12} className="mr-1" />
                          Verified
                        </>
                      ) : (
                        <>
                          <XCircle size={12} className="mr-1" />
                          Not verified
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <ThumbsUp size={12} className="text-gray-500 mr-1" />
                      {review.helpfulCount}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedReview(review)}
                        className="text-primary-600 hover:text-primary-900"
                        title="View review"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(review._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete review"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {reviews.length === 0 && (
        <div className="text-center py-12">
          <Star size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No reviews found
          </h3>
          <p className="text-gray-600">
            No reviews yet
          </p>
        </div>
      )}

      {selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Review</h2>
                <button
                  onClick={() => setSelectedReview(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Bicycle</p>
                    <p className="font-medium">
                      {typeof selectedReview.bicycle === 'object' ? selectedReview.bicycle.name : 'Bicycle'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">User</p>
                    <p className="font-medium">
                      {typeof selectedReview.user === 'object' ? selectedReview.user.username : 'User'}
                    </p>
                    {typeof selectedReview.user === 'object' && selectedReview.user.email && (
                      <p className="text-sm text-gray-500">{selectedReview.user.email}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Rating</p>
                    <div className="flex items-center">
                      {renderStars(selectedReview.rating)}
                      <span className="ml-2 text-gray-900 font-medium">
                        {selectedReview.rating}/5
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-medium">
                      {new Date(selectedReview.createdAt).toLocaleString('en-US')}
                    </p>
                  </div>
                  {selectedReview.order && (
                    <div>
                      <p className="text-sm text-gray-600">Order number</p>
                      <p className="font-medium">
                        #{selectedReview.order.slice(-8)}
                      </p>
                    </div>
                  )}
                </div>

                {selectedReview.title && (
                  <div>
                    <p className="text-sm text-gray-600">Title</p>
                    <p className="font-medium text-lg">{selectedReview.title}</p>
                  </div>
                )}

                {selectedReview.comment && (
                  <div>
                    <p className="text-sm text-gray-600">Comment</p>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="text-gray-900 whitespace-pre-wrap">{selectedReview.comment}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <button
                    onClick={() => toggleVerified(selectedReview._id, selectedReview.isVerified)}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${selectedReview.isVerified ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'}`}
                  >
                    {selectedReview.isVerified ? (
                      <>
                        <CheckCircle size={14} className="mr-2" />
                        Mark as unverified
                      </>
                    ) : (
                      <>
                        <XCircle size={14} className="mr-2" />
                        Mark as verified
                      </>
                    )}
                  </button>
                  <div className="flex items-center text-sm text-gray-600">
                    <ThumbsUp size={14} className="mr-1" />
                    Helpful: {selectedReview.helpfulCount} people
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReviewsAdminPage