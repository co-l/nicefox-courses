import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentSession, updateSessionItem, updateSessionStatus } from '../services/api'
import type { SessionWithItems, StockSessionItem } from '../types'

export function PreShopping() {
  const navigate = useNavigate()
  const [session, setSession] = useState<SessionWithItems | null>(null)
  const [loading, setLoading] = useState(true)
  const [transitioning, setTransitioning] = useState(false)

  useEffect(() => {
    loadSession()
  }, [])

  async function loadSession() {
    try {
      const data = await getCurrentSession()
      if (!data) {
        navigate('/')
        return
      }
      if (data.status === 'shopping') {
        navigate('/shopping')
        return
      }
      if (data.status === 'completed') {
        navigate('/')
        return
      }
      setSession(data)
    } catch (error) {
      console.error('Failed to load session:', error)
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  async function handleQuantityChange(item: StockSessionItem, value: string) {
    const qty = value === '' ? null : parseFloat(value)
    
    // Optimistic update
    setSession((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        items: prev.items.map((i) =>
          i.itemId === item.itemId
            ? {
                ...i,
                countedQuantity: qty,
                toBuy: qty !== null ? Math.max(0, i.item.targetQuantity - qty) : 0,
              }
            : i
        ),
      }
    })

    try {
      await updateSessionItem(session!.id, item.itemId, { countedQuantity: qty })
    } catch (error) {
      console.error('Failed to update item:', error)
      loadSession() // Reload on error
    }
  }

  async function handleContinue() {
    if (!session) return
    setTransitioning(true)
    try {
      await updateSessionStatus(session.id, 'shopping')
      navigate('/shopping')
    } catch (error) {
      console.error('Failed to update session:', error)
      setTransitioning(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  // Group items by homeLocation, sorted by homeOrder
  const sortedItems = [...session.items].sort((a, b) => a.item.homeOrder - b.item.homeOrder)
  const groupedItems = sortedItems.reduce((acc, item) => {
    const location = item.item.homeLocation
    if (!acc[location]) {
      acc[location] = []
    }
    acc[location].push(item)
    return acc
  }, {} as Record<string, StockSessionItem[]>)

  const filledCount = session.items.filter((i) => i.countedQuantity !== null).length

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Inventaire</h1>
        <button
          onClick={handleContinue}
          disabled={transitioning}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-1"
        >
          {transitioning ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <>
              Continuer
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        {filledCount}/{session.items.length} éléments comptés
      </p>

      {session.items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>Aucun élément dans l'inventaire</p>
          <button
            onClick={() => navigate('/items')}
            className="mt-2 text-blue-600 hover:underline"
          >
            Ajouter des éléments
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedItems).map(([location, items]) => (
            <div key={location}>
              <h2 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <span className="text-lg">📍</span>
                {location}
              </h2>
              <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
                {items.map((item) => (
                  <div key={item.id} className="p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{item.item.name}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={item.countedQuantity ?? ''}
                        onChange={(e) => handleQuantityChange(item, e.target.value)}
                        placeholder="0"
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="text-gray-500 text-sm whitespace-nowrap">
                        / {item.item.targetQuantity} {item.item.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
