import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentSession, createSession, createTemporaryItem } from '../services/api'
import type { SessionWithItems } from '../types'

export function Home() {
  const navigate = useNavigate()
  const [currentSession, setCurrentSession] = useState<SessionWithItems | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [tempItemName, setTempItemName] = useState('')
  const [addingItem, setAddingItem] = useState(false)
  const [recentlyAdded, setRecentlyAdded] = useState<string | null>(null)

  useEffect(() => {
    loadSession()
  }, [])

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

  const handleAddTemporaryItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tempItemName.trim() || addingItem) return

    setAddingItem(true)
    try {
      await createTemporaryItem(tempItemName.trim())
      setRecentlyAdded(tempItemName.trim())
      setTempItemName('')
      // Reload session to get updated items
      await loadSession()
      // Clear the "added" message after 2 seconds
      setTimeout(() => setRecentlyAdded(null), 2000)
    } catch (error) {
      console.error('Failed to add temporary item:', error)
      alert('Erreur lors de l\'ajout')
    } finally {
      setAddingItem(false)
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
    <div className="space-y-6">
      {/* Quick add temporary item */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-sm font-medium text-gray-700 mb-2">Ajouter pour cette fois</h2>
        <form onSubmit={handleAddTemporaryItem} className="flex gap-2">
          <input
            type="text"
            value={tempItemName}
            onChange={(e) => setTempItemName(e.target.value)}
            placeholder="Ex: Ampoules, Piles..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
          />
          <button
            type="submit"
            disabled={!tempItemName.trim() || addingItem}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {addingItem ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            )}
          </button>
        </form>
        {recentlyAdded && (
          <p className="text-sm text-green-600 mt-2">"{recentlyAdded}" ajouté</p>
        )}
        <p className="text-xs text-gray-500 mt-2">
          Cet article sera supprimé après la session de courses
        </p>
      </div>

      {/* Session actions */}
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
    </div>
  )
}
