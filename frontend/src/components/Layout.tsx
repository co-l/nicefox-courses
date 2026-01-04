import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth()
  const location = useLocation()

  const isHome = location.pathname === '/'
  const isInventory = location.pathname === '/inventory'
  const isShopping = location.pathname === '/shopping'
  const isMainPage = isHome || isInventory || isShopping

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-gray-900">
            Stock Alimentaire
          </Link>
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">{user.email}</span>
              <button
                onClick={logout}
                className="text-sm text-gray-400 hover:text-gray-600"
                title="Déconnexion"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          )}
        </div>
        {/* Navigation tabs for main pages */}
        {isMainPage && (
          <div className="max-w-lg mx-auto px-4 pb-2">
            <div className="flex rounded-lg bg-gray-100 p-1">
              <Link
                to="/"
                className={`flex-1 py-2 text-center text-sm font-medium rounded-md transition-colors ${
                  isHome
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Accueil
              </Link>
              <Link
                to="/inventory"
                className={`flex-1 py-2 text-center text-sm font-medium rounded-md transition-colors ${
                  isInventory
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Inventaire
              </Link>
              <Link
                to="/shopping"
                className={`flex-1 py-2 text-center text-sm font-medium rounded-md transition-colors ${
                  isShopping
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Courses
              </Link>
            </div>
          </div>
        )}
      </header>
      <main className="max-w-lg mx-auto px-4 py-6">
        {!isMainPage && (
          <Link
            to="/"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour
          </Link>
        )}
        {children}
      </main>
    </div>
  )
}
