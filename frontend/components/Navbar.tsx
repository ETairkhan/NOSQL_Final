'use client'

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth()

  const handleLogout = () => {
    logout()
  }

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-2xl font-bold text-primary-600">
              E-Commerce
            </Link>
            <div className="hidden md:flex space-x-4">
              <Link
                href="/products"
                className="text-gray-700 hover:text-primary-600 transition-colors"
              >
                Товары
              </Link>
              {isAuthenticated && (
                <>
                  <Link
                    href="/orders"
                    className="text-gray-700 hover:text-primary-600 transition-colors"
                  >
                    Заказы
                  </Link>
                  {user?.role === 'admin' && (
                    <Link
                      href="/admin"
                      className="text-gray-700 hover:text-primary-600 transition-colors"
                    >
                      Админ-панель
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <span className="text-gray-700">
                  {user?.username}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-primary-600 hover:text-primary-700 transition-colors"
                >
                  Войти
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Регистрация
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar

