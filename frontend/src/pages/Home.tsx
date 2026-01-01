import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentSession, createSession } from '../services/api'
import type { SessionWithItems } from '../types'

export function Home() {
  const navigate = useNavigate()
  const [currentSession, setCurrentSession] = useState<SessionWithItems | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    async function loadSession() {
      try {
        const session = await getCurrentSession()
        setCurrentSession(session)
      } catch (error) {
        console.error('Failed to load session:', error)
      } finally {
        setLoading(false)
      }
    }
    loadSession()
  }, [])

  const handleNewSession = async () => {
    if (currentSession) {
      // Navigate to existing session
      if (currentSession.status === 'pre-shopping') {
        navigate('/pre-shopping')
      } else {
        navigate('/shopping')
      }
      return
    }

    setCreating(true)
    try {
      await createSession()
      navigate('/pre-shopping')
    } catch (error) {
      console.error('Failed to create session:', error)
      alert('Erreur lors de la création de la session')
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <button
        onClick={handleNewSession}
        disabled={creating}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {creating ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        ) : currentSession ? (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Continuer la session en cours
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nouvelle session de courses
          </>
        )}
      </button>

      {currentSession && (
        <p className="text-center text-sm text-gray-500">
          Session en cours : {currentSession.status === 'pre-shopping' ? 'Inventaire' : 'Courses'}
        </p>
      )}

      <button
        onClick={() => navigate('/items')}
        className="w-full bg-white hover:bg-gray-50 text-gray-900 font-medium py-4 px-6 rounded-lg border border-gray-300 transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
        Gérer les éléments
      </button>
    </div>
  )
}
