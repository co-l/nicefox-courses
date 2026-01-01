import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentSession, createSession, createTemporaryItem, getItems, deleteItem } from '../services/api'
import type { SessionWithItems, StockItem } from '../types'

type Unit = 'kg' | 'unité(s)'

export function Home() {
  const navigate = useNavigate()
  const [currentSession, setCurrentSession] = useState<SessionWithItems | null>(null)
  const [temporaryItems, setTemporaryItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [tempItemName, setTempItemName] = useState('')
  const [tempItemQuantity, setTempItemQuantity] = useState('1')
  const [tempItemUnit, setTempItemUnit] = useState<Unit>('unité(s)')
  const [addingItem, setAddingItem] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [session, items] = await Promise.all([
        getCurrentSession(),
        getItems(),
      ])
      setCurrentSession(session)
      setTemporaryItems(items.filter(i => i.isTemporary))
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNewSession = async () => {
    if (currentSession) {
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

    const quantity = parseFloat(tempItemQuantity) || 1

    setAddingItem(true)
    try {
      const item = await createTemporaryItem(tempItemName.trim(), quantity, tempItemUnit)
      setTemporaryItems(prev => [...prev, item])
      setTempItemName('')
      setTempItemQuantity('1')
      setTempItemUnit('unité(s)')
      // Reload session to get updated items
      const session = await getCurrentSession()
      setCurrentSession(session)
    } catch (error) {
      console.error('Failed to add temporary item:', error)
      alert('Erreur lors de l\'ajout')
    } finally {
      setAddingItem(false)
    }
  }

  const handleDeleteTemporaryItem = async (id: string) => {
    try {
      await deleteItem(id)
      setTemporaryItems(prev => prev.filter(i => i.id !== id))
    } catch (error) {
      console.error('Failed to delete item:', error)
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

      {/* Temporary items section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-sm font-medium text-gray-700 mb-3">Ajouter pour les prochaines courses</h2>
        
        {/* List of temporary items */}
        {temporaryItems.length > 0 && (
          <div className="mb-4 divide-y divide-gray-100">
            {temporaryItems.map(item => (
              <div key={item.id} className="flex items-center justify-between py-2">
                <span className="text-gray-900">{item.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">
                    {item.targetQuantity} {item.unit}
                  </span>
                  <button
                    onClick={() => handleDeleteTemporaryItem(item.id)}
                    className="text-gray-400 hover:text-red-600 p-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add form */}
        <form onSubmit={handleAddTemporaryItem} className="space-y-3">
          <input
            type="text"
            value={tempItemName}
            onChange={(e) => setTempItemName(e.target.value)}
            placeholder="Ex: Ampoules, Piles..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
          />
          <div className="flex gap-2">
            <input
              type="number"
              value={tempItemQuantity}
              onChange={(e) => setTempItemQuantity(e.target.value)}
              min="0.1"
              step="0.1"
              className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base text-center"
            />
            <div className="flex-1 flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                type="button"
                onClick={() => setTempItemUnit('unité(s)')}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  tempItemUnit === 'unité(s)'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                unité(s)
              </button>
              <button
                type="button"
                onClick={() => setTempItemUnit('kg')}
                className={`flex-1 py-2 text-sm font-medium transition-colors border-l border-gray-300 ${
                  tempItemUnit === 'kg'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                kg
              </button>
            </div>
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
          </div>
        </form>
        <p className="text-xs text-gray-500 mt-3">
          Ces articles seront supprimés après la session de courses
        </p>
      </div>
    </div>
  )
}
