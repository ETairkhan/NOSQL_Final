# 🚀 Quick Start - Bicycle Store

## Prerequisites

1. **Node.js** version 18 or higher
2. **MongoDB** (local or MongoDB Atlas)
3. **npm** or **yarn**

## Step 1: Install Dependencies

```bash
# Install all dependencies (root, backend, frontend)
npm run install:all
```

Or manually:

```bash
# In root directory
npm install

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

## Step 2: Backend Setup

### 2.1 Create `.env` file in `backend/` folder

```bash
cd backend
copy .env.example .env
```

Or create `.env` file manually with the following content:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/bicyclestore
JWT_SECRET=your_super_secret_jwt_key_change_in_production_12345
NODE_ENV=development
```

**Important:**

- If using MongoDB Atlas, replace `MONGODB_URI` with your connection string
- Change `JWT_SECRET` to a random string for security

### 2.2 Make sure MongoDB is running

**Local:**

```bash
# Windows (if MongoDB is installed as a service, it should start automatically)
# Check in Services (services.msc)

# Or start manually:
mongod
```

**MongoDB Atlas:**

- Use connection string from your cluster

### 2.3 Create admin user

```bash
cd backend
npm run create-admin
```

Credentials will be created:

- **Email:** `admin@example.com`
- **Password:** `admin123`

⚠️ **Important:** Change password after first login!

## Step 3: Frontend Setup

### 3.1 Create `.env.local` file in `frontend/` folder

```bash
cd frontend
```

Create `.env.local` file with the following content:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Step 4: Launch Application

### Option 1: Launch entire project simultaneously (recommended)

```bash
# In root directory
npm run dev
```

This will start:

- Backend on `http://localhost:5000`
- Frontend on `http://localhost:3000`

### Option 2: Launch separately

**Terminal 1 - Backend:**

```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

## Step 5: Open Application

Open browser and go to:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api

## 🔐 Test Credentials

### Admin

- Email: `admin@example.com`
- Password: `admin123`

### Regular User

Create through registration form on the site.

## 📝 Check Functionality

1. Open http://localhost:3000
2. Register or login as admin
3. Check bicycle catalog
4. Admin panel available at `/admin` (admins only)

## ⚠️ Possible Issues

### MongoDB not connecting

- Make sure MongoDB is running
- Check `MONGODB_URI` in `.env`
- For MongoDB Atlas check IP whitelist

### Port already in use

- Change `PORT` in `backend/.env`
- Or stop process using port 5000/3000

### Dependency installation errors

```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Frontend not connecting to Backend

- Check that Backend is running on port 5000
- Check `NEXT_PUBLIC_API_URL` in `frontend/.env.local`
- Make sure no CORS errors in browser console

## 🛠️ Useful Commands

```bash
# Install all dependencies
npm run install:all

# Launch entire project
npm run dev

# Launch only backend
npm run dev:backend

# Launch only frontend
npm run dev:frontend

# Create admin user
cd backend && npm run create-admin
```

## 📚 Additional Information

Detailed documentation is in `README.md`
