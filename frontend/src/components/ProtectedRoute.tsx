import { ReactNode } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface ProtectedRouteProps {
  children: ReactNode
}

// SSO login URL
const AUTH_SERVICE_URL = import.meta.env.VITE_AUTH_URL || 'https://auth.nicefox.net'

// Request token in URL for cross-domain support (localhost dev, etc.)
const NEED_TOKEN_IN_URL = window.location.hostname !== 'nicefox.net' && 
                          !window.location.hostname.endsWith('.nicefox.net')

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, authError } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Server error during auth check - show error instead of redirect loop
  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Erreur d'authentification</h2>
            <p className="text-red-600 mb-4">{authError}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    // Redirect to SSO login with current URL as redirect target
    const currentUrl = window.location.origin + window.location.pathname
    const tokenParam = NEED_TOKEN_IN_URL ? '&token_in_url=true' : ''
    window.location.href = `${AUTH_SERVICE_URL}/login?redirect=${encodeURIComponent(currentUrl)}${tokenParam}`

    // Show loading while redirecting
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return <>{children}</>
}
