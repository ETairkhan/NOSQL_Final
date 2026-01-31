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

export interface BicycleType {
  _id: string
  name: string
  slug: string
  description?: string
  image?: string
  isActive: boolean
  createdAt: string
}

export interface Bicycle {
  _id: string
  name: string
  slug: string
  description: string
  price: number
  discountPrice?: number
  stock: number
  images?: string[]
  type: BicycleType | string
  specifications?: {
    brand?: string
    frame?: {
      material?: string
      size?: string
    }
    wheels?: {
      size?: string
      type?: string
    }
    gears?: {
      front?: number
      rear?: number
      total?: number
    }
    brakes?: {
      type?: string
      brand?: string
    }
    weight?: string
    color?: string
    suspension?: {
      front?: boolean
      rear?: boolean
      type?: string
    }
  }
  ratingSummary?: {
    averageRating: number
    totalReviews: number
  }
  isActive: boolean
  createdAt: string
}

export interface OrderItem {
  bicycle: Bicycle | string
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
  bicycle: Bicycle | string
  order?: string
  rating: number
  title?: string
  comment?: string
  isVerified: boolean
  helpfulCount: number
  createdAt: string
}
