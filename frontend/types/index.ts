export interface User {
  _id: string
  username: string
  email: string
  role: 'customer' | 'admin'
  profile?: {
    firstName?: string
    lastName?: string
    phone?: string
    address?: {
      street?: string
      city?: string
      zipCode?: string
      country?: string
    }
  }
  createdAt: string
}

export interface Category {
  _id: string
  name: string
  slug: string
  description?: string
  image?: string
  isActive: boolean
  createdAt: string
}

export interface Product {
  _id: string
  name: string
  slug: string
  description: string
  price: number
  discountPrice?: number
  stock: number
  images?: string[]
  category: Category | string
  specifications?: {
    brand?: string
    weight?: string
    dimensions?: string
    color?: string
    material?: string
  }
  ratingSummary?: {
    averageRating: number
    totalReviews: number
  }
  isActive: boolean
  createdAt: string
}

export interface OrderItem {
  product: Product | string
  quantity: number
  price: number
  subtotal: number
}

export interface Order {
  _id: string
  user: User | string
  items: OrderItem[]
  shippingAddress: {
    street?: string
    city?: string
    zipCode?: string
    country?: string
  }
  paymentMethod: 'credit_card' | 'paypal' | 'cash_on_delivery'
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  totalAmount: number
  discount: number
  finalAmount: number
  orderDate: string
  deliveredDate?: string
  createdAt: string
}

export interface Review {
  _id: string
  user: User | string
  product: Product | string
  order?: string
  rating: number
  title?: string
  comment?: string
  isVerified: boolean
  helpfulCount: number
  createdAt: string
}

