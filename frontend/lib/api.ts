import axios from 'axios'
import Cookies from 'js-cookie'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = Cookies.get('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      Cookies.remove('token')
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  register: (data: { username: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
}

// Bicycles API
export const bicyclesAPI = {
  getAll: (params?: any) => api.get('/bicycles', { params }),
  getById: (id: string) => api.get(`/bicycles/${id}`),
  create: (data: any) => api.post('/bicycles', data),
  update: (id: string, data: any) => api.put(`/bicycles/${id}`, data),
  updateStock: (id: string, stock: number) => api.patch(`/bicycles/${id}/stock`, { stock }),
  delete: (id: string) => api.delete(`/bicycles/${id}`),
  
  // Alias methods for admin pages
  getAllBicycles: () => api.get('/bicycles?limit=100'),
  createBicycle: (data: any) => api.post('/bicycles', data),
  updateBicycle: (id: string, data: any) => api.put(`/bicycles/${id}`, data),
  deleteBicycle: (id: string) => api.delete(`/bicycles/${id}`),
}

// Bicycle Types API
export const bicycleTypesAPI = {
  getAll: () => api.get('/types'),
  getById: (id: string) => api.get(`/types/${id}`),
  create: (data: any) => api.post('/types', data),
  update: (id: string, data: any) => api.put(`/types/${id}`, data),
  delete: (id: string) => api.delete(`/types/${id}`),
  
  // Alias methods for admin pages
  getAllTypes: () => api.get('/types'),
  createType: (data: any) => api.post('/types', data),
  updateType: (id: string, data: any) => api.put(`/types/${id}`, data),
  deleteType: (id: string) => api.delete(`/types/${id}`),
}

// Orders API
export const ordersAPI = {
  getAll: (params?: any) => api.get('/orders', { params }),
  getById: (id: string) => api.get(`/orders/${id}`),
  create: (data: any) => api.post('/orders', data),
  updateStatus: (id: string, status: string) => api.patch(`/orders/${id}/status`, { status }),
  cancel: (id: string) => api.delete(`/orders/${id}`),
  
  // Alias methods for admin pages
  getAllOrders: () => api.get('/orders?limit=100'),
  updateOrderStatus: (id: string, status: string) => api.patch(`/orders/${id}/status`, { status }),
}

// Reviews API
export const reviewsAPI = {
  getAll: (params?: any) => api.get('/reviews', { params }),
  getById: (id: string) => api.get(`/reviews/${id}`),
  create: (data: any) => api.post('/reviews', data),
  update: (id: string, data: any) => api.put(`/reviews/${id}`, data),
  markHelpful: (id: string) => api.patch(`/reviews/${id}/helpful`),
  delete: (id: string) => api.delete(`/reviews/${id}`),
  
  // Alias methods for admin pages
  getAllReviews: () => api.get('/reviews?limit=100'),
  deleteReview: (id: string) => api.delete(`/reviews/${id}`),
}

// Stats API
export const statsAPI = {
  getOverview: () => api.get('/stats/overview'),
  getSales: () => api.get('/stats/sales'),
  getTopBicycles: (params?: any) => api.get('/stats/bicycles', { params }),
  getTypeStats: () => api.get('/stats/types'),
  getReviewsStats: () => api.get('/stats/reviews'),
  
  // Alias methods for admin pages
  getSalesStats: () => api.get('/stats/sales'),
}

export { api }