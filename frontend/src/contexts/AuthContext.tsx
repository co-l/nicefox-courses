import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

const TOKEN_KEY = 'auth_token'
const AUTH_URL = import.meta.env.VITE_AUTH_URL || 'https://auth.nicefox.net'
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3100/api'

interface User {
  id: string
  email: string
  role: 'user' | 'admin'
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: () => void
  logout: () => void
  getToken: () => string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for token in URL (returning from auth)
    const params = new URLSearchParams(window.location.search)
    const tokenFromUrl = params.get('token')
    
    if (tokenFromUrl) {
      localStorage.setItem(TOKEN_KEY, tokenFromUrl)
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname)
    }

    // Verify token with backend
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setLoading(false)
      return
    }

    fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(setUser)
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false))
  }, [])

  const login = () => {
    const returnUrl = window.location.href
    window.location.href = `${AUTH_URL}/login?redirect=${encodeURIComponent(returnUrl)}`
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
    window.location.href = '/'
  }

  const getToken = () => localStorage.getItem(TOKEN_KEY)

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, getToken }}>
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
