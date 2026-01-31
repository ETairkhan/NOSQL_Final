# 🚀 Быстрый старт - Bicycle Store

## Предварительные требования

1. **Node.js** версии 18 или выше
2. **MongoDB** (локально или MongoDB Atlas)
3. **npm** или **yarn**

## Шаг 1: Установка зависимостей

```bash
# Установка всех зависимостей (корневая, backend, frontend)
npm run install:all
```

Или вручную:
```bash
# В корневой директории
npm install

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

## Шаг 2: Настройка Backend

### 2.1 Создайте файл `.env` в папке `backend/`

```bash
cd backend
copy .env.example .env
```

Или создайте файл `.env` вручную со следующим содержимым:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/bicyclestore
JWT_SECRET=your_super_secret_jwt_key_change_in_production_12345
NODE_ENV=development
```

**Важно:** 
- Если используете MongoDB Atlas, замените `MONGODB_URI` на ваш connection string
- Измените `JWT_SECRET` на случайную строку для безопасности

### 2.2 Убедитесь, что MongoDB запущен

**Локально:**
```bash
# Windows (если MongoDB установлен как сервис, он должен быть запущен автоматически)
# Проверьте в Services (services.msc)

# Или запустите вручную:
mongod
```

**MongoDB Atlas:**
- Используйте connection string из вашего кластера

### 2.3 Создайте админ-пользователя

```bash
cd backend
npm run create-admin
```

Будут созданы учетные данные:
- **Email:** `admin@example.com`
- **Password:** `admin123`

⚠️ **Важно:** Измените пароль после первого входа!

## Шаг 3: Настройка Frontend

### 3.1 Создайте файл `.env.local` в папке `frontend/`

```bash
cd frontend
```

Создайте файл `.env.local` со следующим содержимым:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Шаг 4: Запуск приложения

### Вариант 1: Запуск всего проекта одновременно (рекомендуется)

```bash
# В корневой директории
npm run dev
```

Это запустит:
- Backend на `http://localhost:5000`
- Frontend на `http://localhost:3000`

### Вариант 2: Запуск по отдельности

**Терминал 1 - Backend:**
```bash
cd backend
npm run dev
```

**Терминал 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## Шаг 5: Откройте приложение

Откройте браузер и перейдите по адресу:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api

## 🔐 Тестовые учетные данные

### Админ
- Email: `admin@example.com`
- Password: `admin123`

### Обычный пользователь
Создайте через форму регистрации на сайте.

## 📝 Проверка работы

1. Откройте http://localhost:3000
2. Зарегистрируйтесь или войдите как админ
3. Проверьте каталог велосипедов
4. Админ-панель доступна по адресу `/admin` (только для админов)

## ⚠️ Возможные проблемы

### MongoDB не подключается
- Убедитесь, что MongoDB запущен
- Проверьте `MONGODB_URI` в `.env`
- Для MongoDB Atlas проверьте IP whitelist

### Порт уже занят
- Измените `PORT` в `backend/.env`
- Или остановите процесс, использующий порт 5000/3000

### Ошибки при установке зависимостей
```bash
# Очистите кэш и переустановите
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Frontend не подключается к Backend
- Проверьте, что Backend запущен на порту 5000
- Проверьте `NEXT_PUBLIC_API_URL` в `frontend/.env.local`
- Убедитесь, что нет CORS ошибок в консоли браузера

## 🛠️ Полезные команды

```bash
# Установка всех зависимостей
npm run install:all

# Запуск всего проекта
npm run dev

# Запуск только backend
npm run dev:backend

# Запуск только frontend
npm run dev:frontend

# Создание админ-пользователя
cd backend && npm run create-admin
```

## 📚 Дополнительная информация

Подробная документация находится в файле `README.md`


