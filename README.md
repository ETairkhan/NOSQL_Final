# E-Commerce Platform - NoSQL Final Project

Полнофункциональная платформа электронной коммерции, построенная с использованием MongoDB (NoSQL), Node.js/Express для backend и Next.js для frontend.

## 📋 Описание проекта

Это веб-приложение для интернет-магазина, которое демонстрирует продвинутые возможности работы с MongoDB, включая:
- Embedded и referenced документы
- Многоэтапные aggregation pipelines
- Advanced update/delete операции
- Compound indexes для оптимизации запросов
- Аутентификацию и авторизацию

## 🏗️ Архитектура системы

### Backend
- **Технологии**: Node.js, Express.js, MongoDB (Mongoose)
- **Архитектура**: RESTful API
- **База данных**: MongoDB

### Frontend
- **Технологии**: Next.js 14, React, TypeScript, TailwindCSS
- **Архитектура**: Server-side rendering с клиентскими компонентами

## 📦 Структура проекта

```
final2/
├── backend/
│   ├── models/          # Mongoose модели
│   ├── routes/          # API маршруты
│   ├── middleware/      # Middleware (auth)
│   └── server.js        # Точка входа
├── frontend/
│   ├── app/             # Next.js страницы
│   ├── components/      # React компоненты
│   ├── lib/             # Утилиты (API клиент)
│   ├── context/         # React Context (Auth)
│   └── types/           # TypeScript типы
└── README.md
```

## 🗄️ Схема базы данных

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

#### 2. Categories
```javascript
{
  name: String (unique, required),
  slug: String (unique),
  description: String,
  image: String,
  isActive: Boolean
}
```

**Indexes:**
- `slug: 1`
- `isActive: 1`

#### 3. Products
```javascript
{
  name: String (required),
  slug: String (unique),
  description: String,
  price: Number,
  discountPrice: Number,
  stock: Number,
  images: [String],
  category: ObjectId (ref: Category),  // Referenced
  specifications: {  // Embedded document
    brand: String,
    weight: String,
    dimensions: String,
    color: String,
    material: String
  },
  ratingSummary: {  // Embedded document
    averageRating: Number,
    totalReviews: Number
  }
}
```

**Compound Indexes:**
- `{ category: 1, isActive: 1 }`
- `{ price: 1, isActive: 1 }`
- `{ 'ratingSummary.averageRating': -1 }`

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
  product: ObjectId (ref: Product),  // Referenced
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
- `POST /api/auth/register` - Регистрация пользователя
- `POST /api/auth/login` - Вход в систему
- `GET /api/auth/me` - Получить текущего пользователя

### Products (`/api/products`)
- `GET /api/products` - Получить все товары (с фильтрацией, пагинацией, сортировкой)
- `GET /api/products/:id` - Получить товар по ID
- `POST /api/products` - Создать товар (Admin only)
- `PUT /api/products/:id` - Обновить товар (Admin only)
- `PATCH /api/products/:id/stock` - Обновить количество на складе (Advanced: `$inc`)
- `DELETE /api/products/:id` - Удалить товар (Admin only, soft delete)

### Categories (`/api/categories`)
- `GET /api/categories` - Получить все категории
- `GET /api/categories/:id` - Получить категорию по ID
- `POST /api/categories` - Создать категорию (Admin only)
- `PUT /api/categories/:id` - Обновить категорию (Admin only)
- `DELETE /api/categories/:id` - Удалить категорию (Admin only)

### Orders (`/api/orders`)
- `GET /api/orders` - Получить заказы (свои или все для admin)
- `GET /api/orders/:id` - Получить заказ по ID
- `POST /api/orders` - Создать заказ
- `PATCH /api/orders/:id/status` - Обновить статус заказа (Advanced: `$set`)
- `DELETE /api/orders/:id` - Отменить заказ

### Reviews (`/api/reviews`)
- `GET /api/reviews` - Получить отзывы (опционально по товару)
- `GET /api/reviews/:id` - Получить отзыв по ID
- `POST /api/reviews` - Создать отзыв
- `PUT /api/reviews/:id` - Обновить отзыв
- `PATCH /api/reviews/:id/helpful` - Отметить отзыв как полезный (Advanced: `$inc`)
- `DELETE /api/reviews/:id` - Удалить отзыв

### Statistics (`/api/stats`) - Aggregation Endpoints
- `GET /api/stats/sales` - Статистика продаж (Admin only)
- `GET /api/stats/products` - Топ продаваемых товаров (Admin only)
- `GET /api/stats/categories` - Статистика по категориям (Admin only)
- `GET /api/stats/reviews` - Статистика отзывов
- `GET /api/stats/overview` - Общая статистика (Admin only)

**Всего: 23+ endpoints**

## 🔍 MongoDB Queries Examples

### 1. Advanced Update Operations

#### Update Stock with $inc
```javascript
// PATCH /api/products/:id/stock
Product.findByIdAndUpdate(
  productId,
  { $inc: { stock: quantity } },
  { new: true }
)
```

#### Update Order Status with $set
```javascript
// PATCH /api/orders/:id/status
Order.findByIdAndUpdate(
  orderId,
  { $set: { status: newStatus, deliveredDate: new Date() } },
  { new: true }
)
```

#### Increment Helpful Count with $inc
```javascript
// PATCH /api/reviews/:id/helpful
Review.findByIdAndUpdate(
  reviewId,
  { $inc: { helpfulCount: 1 } },
  { new: true }
)
```

### 2. Aggregation Pipelines

#### Sales Statistics
```javascript
Order.aggregate([
  { $match: { status: { $ne: 'cancelled' } } },
  {
    $group: {
      _id: null,
      totalOrders: { $sum: 1 },
      totalRevenue: { $sum: '$finalAmount' },
      averageOrderValue: { $avg: '$finalAmount' },
      totalItemsSold: {
        $sum: {
          $reduce: {
            input: '$items',
            initialValue: 0,
            in: { $add: ['$$value', '$$this.quantity'] }
          }
        }
      }
    }
  }
])
```

#### Top Selling Products
```javascript
Order.aggregate([
  { $match: { status: { $ne: 'cancelled' } } },
  { $unwind: '$items' },
  {
    $group: {
      _id: '$items.product',
      totalSold: { $sum: '$items.quantity' },
      totalRevenue: { $sum: '$items.subtotal' }
    }
  },
  { $sort: { totalSold: -1 } },
  { $limit: 10 },
  {
    $lookup: {
      from: 'products',
      localField: '_id',
      foreignField: '_id',
      as: 'product'
    }
  },
  { $unwind: '$product' }
])
```

#### Sales by Category
```javascript
Order.aggregate([
  { $match: { status: { $ne: 'cancelled' } } },
  { $unwind: '$items' },
  {
    $lookup: {
      from: 'products',
      localField: 'items.product',
      foreignField: '_id',
      as: 'product'
    }
  },
  { $unwind: '$product' },
  {
    $lookup: {
      from: 'categories',
      localField: 'product.category',
      foreignField: '_id',
      as: 'category'
    }
  },
  { $unwind: '$category' },
  {
    $group: {
      _id: '$category._id',
      categoryName: { $first: '$category.name' },
      totalSold: { $sum: '$items.quantity' },
      totalRevenue: { $sum: '$items.subtotal' }
    }
  },
  { $sort: { totalRevenue: -1 } }
])
```

#### Update Product Rating Summary
```javascript
Review.aggregate([
  { $match: { product: productId } },
  {
    $group: {
      _id: null,
      averageRating: { $avg: '$rating' },
      totalReviews: { $sum: 1 }
    }
  }
])
```

### 3. Advanced Delete Operations

#### Soft Delete Product
```javascript
Product.findByIdAndUpdate(
  productId,
  { $set: { isActive: false } },
  { new: true }
)
```

#### Cancel Order with Stock Restoration
```javascript
// Restore stock for each item
for (const item of order.items) {
  await Product.findByIdAndUpdate(
    item.product,
    { $inc: { stock: item.quantity } }
  )
}
order.status = 'cancelled'
await order.save()
```

## 🔐 Authentication & Authorization

- **JWT-based authentication**: Токены хранятся в cookies
- **Role-based access control**: `customer` и `admin` роли
- **Protected routes**: Middleware `authenticate` и `authorize`

## 📱 Frontend Pages

1. **Home** (`/`) - Главная страница с популярными товарами
2. **Products** (`/products`) - Каталог товаров с фильтрацией
3. **Product Detail** (`/products/:id`) - Детальная страница товара с отзывами
4. **Login** (`/login`) - Страница входа
5. **Register** (`/register`) - Страница регистрации
6. **Orders** (`/orders`) - Страница заказов пользователя
7. **Admin Panel** (`/admin`) - Админ-панель со статистикой

## 🚀 Установка и запуск

### Требования
- Node.js 18+
- MongoDB (локально или MongoDB Atlas)

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Отредактируйте .env файл
npm run dev
```

### Frontend

```bash
cd frontend
npm install
# Создайте .env.local с NEXT_PUBLIC_API_URL=http://localhost:5000/api
npm run dev
```

### Запуск всего проекта

```bash
# В корневой директории
npm install
npm run install:all
npm run dev
```

### Создание админ-пользователя

После запуска backend, создайте админ-пользователя для доступа к админ-панели:

```bash
cd backend
npm run create-admin
```

Будут созданы учетные данные:
- Email: `admin@example.com`
- Password: `admin123`

**Важно**: Измените пароль после первого входа!

## 📊 Индексы и оптимизация

### Compound Indexes

1. **Products**: `{ category: 1, isActive: 1 }` - для фильтрации по категориям
2. **Products**: `{ price: 1, isActive: 1 }` - для сортировки по цене
3. **Orders**: `{ user: 1, orderDate: -1 }` - для получения заказов пользователя
4. **Orders**: `{ status: 1, orderDate: -1 }` - для фильтрации по статусу
5. **Reviews**: `{ user: 1, product: 1 }` - уникальность отзыва на товар

### Оптимизация запросов

- Использование `populate()` для referenced документов
- Пагинация для больших списков
- Индексы на часто используемых полях
- Aggregation pipelines для сложных запросов

## 🎯 Особенности реализации

### Embedded vs Referenced Documents

- **Embedded**: `specifications`, `ratingSummary` в Product, `items` в Order, `address` в User
- **Referenced**: `category` в Product, `user` в Order/Review, `product` в Order/Review

### Advanced MongoDB Operations

- `$set` - для обновления полей
- `$inc` - для инкремента числовых значений
- `$push` / `$pull` - для работы с массивами (готово к использованию)
- Positional operators - для обновления элементов массивов

### Business Logic

- Автоматическое обновление рейтинга товара при добавлении отзыва
- Восстановление товара на складе при отмене заказа
- Проверка наличия товара при создании заказа
- Верификация отзывов для пользователей, сделавших заказ

## 📝 Дополнительные функции

- ✅ Пагинация и фильтрация
- ✅ Сортировка товаров
- ✅ Поиск по категориям
- ✅ Система отзывов с рейтингами
- ✅ Админ-панель со статистикой
- ✅ Централизованная обработка ошибок
- ✅ Валидация данных (express-validator)
- ✅ Environment configuration (.env)

## 👥 Вклад студентов

[Укажите вклад каждого студента, если проект выполняется в команде]

## 📄 Лицензия

MIT

