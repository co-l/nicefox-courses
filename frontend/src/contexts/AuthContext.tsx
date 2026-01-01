import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import axios from 'axios'
import { getMe } from '../services/api'
import type { AuthUser } from '../types'

// Storage key for dev mode token
const DEV_TOKEN_KEY = 'dev_auth_token'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  authError: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    async function checkAuth() {
      // Check if SSO returned a token in URL (for dev mode / cross-domain)
      const urlParams = new URLSearchParams(window.location.search)
      const tokenFromUrl = urlParams.get('token')

      if (tokenFromUrl) {
        // Store token for dev mode and clean URL
        console.log('Token from URL, storing in localStorage')
        localStorage.setItem(DEV_TOKEN_KEY, tokenFromUrl)
        window.history.replaceState({}, '', window.location.pathname)
      }
      
      console.log('Token in localStorage:', !!localStorage.getItem(DEV_TOKEN_KEY))

      try {
        const me = await getMe()
        setUser(me)
        setAuthError(null)
      } catch (error) {
        console.log('Auth error:', error)
        if (axios.isAxiosError(error)) {
          const status = error.response?.status
          console.log('Axios error status:', status)

          // 401 or no response (network error before auth) = not authenticated
          if (status === 401 || !error.response) {
            // Not authenticated - clear token and allow redirect to SSO
            if (!tokenFromUrl) {
              localStorage.removeItem(DEV_TOKEN_KEY)
            }
            setUser(null)
            setAuthError(null)
          } else {
            // Server error (500, etc.) - don't redirect to SSO
            setUser(null)
            setAuthError(error.response?.data?.error || 'Erreur serveur lors de l\'authentification')
            console.error('Auth check failed with server error:', status, error.message)
          }
        } else {
          console.log('Non-axios error:', error)
          // Treat unknown errors as auth failure, not server error
          setUser(null)
          setAuthError(null)
        }
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, authError }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
