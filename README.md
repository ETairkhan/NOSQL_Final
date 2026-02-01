# Bicycle Store - NoSQL Final Project

Полнофункциональный магазин велосипедов, построенный с использованием MongoDB (NoSQL), Node.js/Express для backend и Next.js для frontend.

## 📋 Описание проекта

Это веб-приложение для магазина велосипедов, которое демонстрирует продвинутые возможности работы с MongoDB, включая:
- Embedded и referenced документы
- Многоэтапные aggregation pipelines
- Advanced update/delete операции
- Compound indexes для оптимизации запросов
- Аутентификацию и авторизацию

## 🏗️ Архитектура системы

### Backend
- **Технологии**: Node.js, Express.js, MongoDB (Mongoose)
- **Архитектура**: RESTful API
- **База данных**: MongoDB (bicyclestore)

### Frontend
- **Технологии**: Next.js 14, React, TypeScript, TailwindCSS
- **Архитектура**: Server-side rendering с клиентскими компонентами
- **Тематика**: Магазин велосипедов

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

#### 2. BicycleTypes
```javascript
{
  name: String (unique, required), // Горный, Шоссейный, Городской и т.д.
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
- `POST /api/auth/register` - Регистрация пользователя
- `POST /api/auth/login` - Вход в систему
- `GET /api/auth/me` - Получить текущего пользователя

### Bicycles (`/api/bicycles`)
- `GET /api/bicycles` - Получить все велосипеды (с фильтрацией, пагинацией, сортировкой)
- `GET /api/bicycles/:id` - Получить велосипед по ID
- `POST /api/bicycles` - Создать велосипед (Admin only)
- `PUT /api/bicycles/:id` - Обновить велосипед (Admin only)
- `PATCH /api/bicycles/:id/stock` - Обновить количество на складе (Advanced: `$inc`)
- `DELETE /api/bicycles/:id` - Удалить велосипед (Admin only, soft delete)

### BicycleTypes (`/api/types`)
- `GET /api/types` - Получить все типы велосипедов
- `GET /api/types/:id` - Получить тип по ID
- `POST /api/types` - Создать тип (Admin only)
- `PUT /api/types/:id` - Обновить тип (Admin only)
- `DELETE /api/types/:id` - Удалить тип (Admin only)

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
- `GET /api/stats/bicycles` - Топ продаваемых велосипедов (Admin only)
- `GET /api/stats/types` - Статистика по типам велосипедов (Admin only)
- `GET /api/stats/reviews` - Статистика отзывов
- `GET /api/stats/overview` - Общая статистика (Admin only)

**Всего: 23+ endpoints**

## 🔍 MongoDB Queries Examples

### 1. Advanced Update Operations

#### Update Stock with $inc
```javascript
// PATCH /api/bicycles/:id/stock
Bicycle.findByIdAndUpdate(
  bicycleId,
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

#### Top Selling Bicycles
```javascript
Order.aggregate([
  { $match: { status: { $ne: 'cancelled' } } },
  { $unwind: '$items' },
  {
    $group: {
      _id: '$items.bicycle',
      totalSold: { $sum: '$items.quantity' },
      totalRevenue: { $sum: '$items.subtotal' }
    }
  },
  { $sort: { totalSold: -1 } },
  { $limit: 10 },
  {
    $lookup: {
      from: 'bicycles',
      localField: '_id',
      foreignField: '_id',
      as: 'bicycle'
    }
  },
  { $unwind: '$bicycle' }
])
```

#### Sales by Bicycle Type
```javascript
Order.aggregate([
  { $match: { status: { $ne: 'cancelled' } } },
  { $unwind: '$items' },
  {
    $lookup: {
      from: 'bicycles',
      localField: 'items.bicycle',
      foreignField: '_id',
      as: 'bicycle'
    }
  },
  { $unwind: '$bicycle' },
  {
    $lookup: {
      from: 'bicycletypes',
      localField: 'bicycle.type',
      foreignField: '_id',
      as: 'type'
    }
  },
  { $unwind: '$type' },
  {
    $group: {
      _id: '$type._id',
      typeName: { $first: '$type.name' },
      totalSold: { $sum: '$items.quantity' },
      totalRevenue: { $sum: '$items.subtotal' }
    }
  },
  { $sort: { totalRevenue: -1 } }
])
```

#### Update Bicycle Rating Summary
```javascript
Review.aggregate([
  { $match: { bicycle: bicycleId } },
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

#### Soft Delete Bicycle
```javascript
Bicycle.findByIdAndUpdate(
  bicycleId,
  { $set: { isActive: false } },
  { new: true }
)
```

#### Cancel Order with Stock Restoration
```javascript
// Restore stock for each item
for (const item of order.items) {
  await Bicycle.findByIdAndUpdate(
    item.bicycle,
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

1. **Home** (`/`) - Главная страница с популярными велосипедами
2. **Bicycles** (`/bicycles`) - Каталог велосипедов с фильтрацией
3. **Bicycle Detail** (`/bicycles/:id`) - Детальная страница велосипеда с отзывами
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

- **Embedded**: `specifications` (frame, wheels, gears, brakes, suspension), `ratingSummary` в Bicycle, `items` в Order, `address` в User
- **Referenced**: `type` в Bicycle, `user` в Order/Review, `bicycle` в Order/Review

### Advanced MongoDB Operations

- `$set` - для обновления полей
- `$inc` - для инкремента числовых значений
- `$push` / `$pull` - для работы с массивами (готово к использованию)
- Positional operators - для обновления элементов массивов

### Business Logic

- Автоматическое обновление рейтинга велосипеда при добавлении отзыва
- Восстановление велосипеда на складе при отмене заказа
- Проверка наличия велосипеда при создании заказа
- Верификация отзывов для пользователей, сделавших заказ
- Детальные спецификации велосипедов (рама, колеса, передачи, тормоза, подвеска)

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

Yermek Tairkhan,
Abilkaiyr Uzbekbay

## 📄 Лицензия

MIT

