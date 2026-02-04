# Bicycle Store - NoSQL Final Project

Full-featured bicycle store built using MongoDB (NoSQL), Node.js/Express for backend and Next.js for frontend.

## 📋 Project Description

This is a web application for a bicycle store that demonstrates advanced MongoDB capabilities, including:

- Embedded and referenced documents
- Multi-stage aggregation pipelines
- Advanced update/delete operations
- Compound indexes for query optimization
- Authentication and authorization

## 🏗️ System Architecture

### Backend

- **Technologies**: Node.js, Express.js, MongoDB (Mongoose)
- **Architecture**: RESTful API
- **Database**: MongoDB (bicyclestore)

### Frontend

- **Technologies**: Next.js 14, React, TypeScript, TailwindCSS
- **Architecture**: Server-side rendering with client components
- **Theme**: Bicycle store

## 📦 Project Structure

```
final2/
├── backend/
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── middleware/      # Middleware (auth)
│   └── server.js        # Entry point
├── frontend/
│   ├── app/             # Next.js pages
│   ├── components/      # React components
│   ├── lib/             # Utilities (API client)
│   ├── context/         # React Context (Auth)
│   └── types/           # TypeScript types
└── README.md
```

## 🗄️ Database Schema

### Collections

#### 1. Users

```javascript
{
  username: String (unique, required),
  email: String (unique, required),
  password: String (hashed),
  role: String (enum: 'customer', 'admin'),
  profile: {
    firstName: String,
    lastName: String,
    phone: String,
    address: { ... }  // Embedded document
  }
}
```

**Indexes:**

- `email: 1`
- `username: 1`
- `role: 1`

#### 2. BicycleTypes

```javascript
{
  name: String (unique, required), // Mountain, Road, City, etc.
  slug: String (unique),
  description: String,
  image: String,
  isActive: Boolean
}
```

**Indexes:**

- `slug: 1`
- `isActive: 1`

#### 3. Bicycles

```javascript
{
  name: String (required),
  slug: String (unique),
  description: String,
  price: Number,
  discountPrice: Number,
  stock: Number,
  images: [String],
  type: ObjectId (ref: BicycleType),  // Referenced
  specifications: {  // Embedded document
    brand: String,
    frame: {
      material: String, // aluminum, carbon, steel, titanium
      size: String // XS, S, M, L, XL
    },
    wheels: {
      size: String, // 26", 27.5", 29", 700c
      type: String // mountain, road, hybrid
    },
    gears: {
      front: Number,
      rear: Number,
      total: Number
    },
    brakes: {
      type: String, // disc, rim, hydraulic
      brand: String
    },
    weight: String,
    color: String,
    suspension: {
      front: Boolean,
      rear: Boolean,
      type: String // hardtail, full-suspension, rigid
    }
  },
  ratingSummary: {  // Embedded document
    averageRating: Number,
    totalReviews: Number
  }
}
```

**Compound Indexes:**

- `{ type: 1, isActive: 1 }`
- `{ price: 1, isActive: 1 }`
- `{ 'ratingSummary.averageRating': -1 }`
- `{ 'specifications.brand': 1 }`

#### 4. Orders

```javascript
{
  user: ObjectId (ref: User),  // Referenced
  items: [{  // Embedded array
    product: ObjectId (ref: Product),
    quantity: Number,
    price: Number,
    subtotal: Number
  }],
  shippingAddress: { ... },  // Embedded document
  paymentMethod: String,
  status: String,
  totalAmount: Number,
  discount: Number,
  finalAmount: Number
}
```

**Indexes:**

- `{ user: 1, orderDate: -1 }`
- `{ status: 1, orderDate: -1 }`
- `{ orderDate: -1 }`

#### 5. Reviews

```javascript
{
  user: ObjectId (ref: User),  // Referenced
  bicycle: ObjectId (ref: Bicycle),  // Referenced
  order: ObjectId (ref: Order),
  rating: Number (1-5),
  title: String,
  comment: String,
  isVerified: Boolean,
  helpfulCount: Number
}
```

**Compound Indexes:**

- `{ user: 1, product: 1 }` (unique)
- `{ product: 1, rating: -1 }`
- `{ createdAt: -1 }`

## 🔌 API Endpoints

### Authentication (`/api/auth`)

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Bicycles (`/api/bicycles`)

- `GET /api/bicycles` - Get all bicycles (with filtering, pagination, sorting)
- `GET /api/bicycles/:id` - Get bicycle by ID
- `POST /api/bicycles` - Create bicycle (Admin only)
- `PUT /api/bicycles/:id` - Update bicycle (Admin only)
- `PATCH /api/bicycles/:id/stock` - Update stock quantity (Advanced: `$inc`)
- `DELETE /api/bicycles/:id` - Delete bicycle (Admin only, soft delete)

### BicycleTypes (`/api/types`)

- `GET /api/types` - Get all bicycle types
- `GET /api/types/:id` - Get type by ID
- `POST /api/types` - Create type (Admin only)
- `PUT /api/types/:id` - Update type (Admin only)
- `DELETE /api/types/:id` - Delete type (Admin only)

### Orders (`/api/orders`)

- `GET /api/orders` - Get orders (own or all for admin)
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create order
- `PATCH /api/orders/:id/status` - Update order status (Advanced: `$set`)
- `DELETE /api/orders/:id` - Cancel order

### Reviews (`/api/reviews`)

- `GET /api/reviews` - Get reviews (optionally by product)
- `GET /api/reviews/:id` - Get review by ID
- `POST /api/reviews` - Create review
- `PUT /api/reviews/:id` - Update review
- `PATCH /api/reviews/:id/helpful` - Mark review as helpful (Advanced: `$inc`)
- `DELETE /api/reviews/:id` - Delete review

### Statistics (`/api/stats`) - Aggregation Endpoints

- `GET /api/stats/sales` - Sales statistics (Admin only)
- `GET /api/stats/bicycles` - Top selling bicycles (Admin only)
- `GET /api/stats/types` - Statistics by bicycle types (Admin only)
- `GET /api/stats/reviews` - Review statistics
- `GET /api/stats/overview` - General statistics (Admin only)

**Total: 23+ endpoints**

## 🔍 MongoDB Queries Examples

### 1. Advanced Update Operations

#### Update Stock with $inc

```javascript
// PATCH /api/bicycles/:id/stock
Bicycle.findByIdAndUpdate(
  bicycleId,
  { $inc: { stock: quantity } },
  { new: true },
);
```

#### Update Order Status with $set

```javascript
// PATCH /api/orders/:id/status
Order.findByIdAndUpdate(
  orderId,
  { $set: { status: newStatus, deliveredDate: new Date() } },
  { new: true },
);
```

#### Increment Helpful Count with $inc

```javascript
// PATCH /api/reviews/:id/helpful
Review.findByIdAndUpdate(
  reviewId,
  { $inc: { helpfulCount: 1 } },
  { new: true },
);
```

### 2. Aggregation Pipelines

#### Sales Statistics

```javascript
Order.aggregate([
  { $match: { status: { $ne: "cancelled" } } },
  {
    $group: {
      _id: null,
      totalOrders: { $sum: 1 },
      totalRevenue: { $sum: "$finalAmount" },
      averageOrderValue: { $avg: "$finalAmount" },
      totalItemsSold: {
        $sum: {
          $reduce: {
            input: "$items",
            initialValue: 0,
            in: { $add: ["$$value", "$$this.quantity"] },
          },
        },
      },
    },
  },
]);
```

#### Top Selling Bicycles

```javascript
Order.aggregate([
  { $match: { status: { $ne: "cancelled" } } },
  { $unwind: "$items" },
  {
    $group: {
      _id: "$items.bicycle",
      totalSold: { $sum: "$items.quantity" },
      totalRevenue: { $sum: "$items.subtotal" },
    },
  },
  { $sort: { totalSold: -1 } },
  { $limit: 10 },
  {
    $lookup: {
      from: "bicycles",
      localField: "_id",
      foreignField: "_id",
      as: "bicycle",
    },
  },
  { $unwind: "$bicycle" },
]);
```

#### Sales by Bicycle Type

```javascript
Order.aggregate([
  { $match: { status: { $ne: "cancelled" } } },
  { $unwind: "$items" },
  {
    $lookup: {
      from: "bicycles",
      localField: "items.bicycle",
      foreignField: "_id",
      as: "bicycle",
    },
  },
  { $unwind: "$bicycle" },
  {
    $lookup: {
      from: "bicycletypes",
      localField: "bicycle.type",
      foreignField: "_id",
      as: "type",
    },
  },
  { $unwind: "$type" },
  {
    $group: {
      _id: "$type._id",
      typeName: { $first: "$type.name" },
      totalSold: { $sum: "$items.quantity" },
      totalRevenue: { $sum: "$items.subtotal" },
    },
  },
  { $sort: { totalRevenue: -1 } },
]);
```

#### Update Bicycle Rating Summary

```javascript
Review.aggregate([
  { $match: { bicycle: bicycleId } },
  {
    $group: {
      _id: null,
      averageRating: { $avg: "$rating" },
      totalReviews: { $sum: 1 },
    },
  },
]);
```

### 3. Advanced Delete Operations

#### Soft Delete Bicycle

```javascript
Bicycle.findByIdAndUpdate(
  bicycleId,
  { $set: { isActive: false } },
  { new: true },
);
```

#### Cancel Order with Stock Restoration

```javascript
// Restore stock for each item
for (const item of order.items) {
  await Bicycle.findByIdAndUpdate(item.bicycle, {
    $inc: { stock: item.quantity },
  });
}
order.status = "cancelled";
await order.save();
```

## 🔐 Authentication & Authorization

- **JWT-based authentication**: Tokens stored in cookies
- **Role-based access control**: `customer` and `admin` roles
- **Protected routes**: `authenticate` and `authorize` middleware

## 📱 Frontend Pages

1. **Home** (`/`) - Home page with popular bicycles
2. **Bicycles** (`/bicycles`) - Bicycle catalog with filtering
3. **Bicycle Detail** (`/bicycles/:id`) - Bicycle detail page with reviews
4. **Login** (`/login`) - Login page
5. **Register** (`/register`) - Registration page
6. **Orders** (`/orders`) - User orders page
7. **Admin Panel** (`/admin`) - Admin panel with statistics

## 🚀 Installation and Launch

### Requirements

- Node.js 18+
- MongoDB (local or MongoDB Atlas)

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env file
npm run dev
```

### Frontend

```bash
cd frontend
npm install
# Create .env.local with NEXT_PUBLIC_API_URL=http://localhost:5000/api
npm run dev
```

### Launch entire project

```bash
# In root directory
npm install
npm run install:all
npm run dev
```

### Create admin user

After launching backend, create admin user for admin panel access:

```bash
cd backend
npm run create-admin
```

Credentials will be created:

- Email: `admin@example.com`
- Password: `admin123`

**Important**: Change password after first login!

## 📊 Indexes and Optimization

### Compound Indexes

1. **Products**: `{ category: 1, isActive: 1 }` - for category filtering
2. **Products**: `{ price: 1, isActive: 1 }` - for price sorting
3. **Orders**: `{ user: 1, orderDate: -1 }` - for getting user orders
4. **Orders**: `{ status: 1, orderDate: -1 }` - for status filtering
5. **Reviews**: `{ user: 1, product: 1 }` - review uniqueness per product

### Query Optimization

- Using `populate()` for referenced documents
- Pagination for large lists
- Indexes on frequently used fields
- Aggregation pipelines for complex queries

## 🎯 Implementation Features

### Embedded vs Referenced Documents

- **Embedded**: `specifications` (frame, wheels, gears, brakes, suspension), `ratingSummary` in Bicycle, `items` in Order, `address` in User
- **Referenced**: `type` in Bicycle, `user` in Order/Review, `bicycle` in Order/Review

### Advanced MongoDB Operations

- `$set` - for field updates
- `$inc` - for incrementing numeric values
- `$push` / `$pull` - for array operations (ready for use)
- Positional operators - for updating array elements

### Business Logic

- Automatic bicycle rating update when adding review
- Bicycle stock restoration when canceling order
- Bicycle availability check when creating order
- Review verification for users who made orders
- Detailed bicycle specifications (frame, wheels, gears, brakes, suspension)

## 📝 Additional Features

- ✅ Pagination and filtering
- ✅ Product sorting
- ✅ Search by categories
- ✅ Review system with ratings
- ✅ Admin panel with statistics
- ✅ Centralized error handling
- ✅ Data validation (express-validator)
- ✅ Environment configuration (.env)

## 👥 Student Contributors

Yermek Tairkhan - did Frontend, architecture, Backend parts
Abilkaiyr Uzbekbay - did Swagger, Backend parts

## 📄 License

MIT
