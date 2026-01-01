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
    await updateQuantity(item, qty)
  }

  async function handleIncrement(item: StockSessionItem) {
    const currentQty = item.countedQuantity ?? 0
    const step = item.item.unit === 'kg' ? 0.5 : 1
    await updateQuantity(item, currentQty + step)
  }

  async function handleDecrement(item: StockSessionItem) {
    const currentQty = item.countedQuantity ?? 0
    const step = item.item.unit === 'kg' ? 0.5 : 1
    const newQty = Math.max(0, currentQty - step)
    await updateQuantity(item, newQty)
  }

  async function updateQuantity(item: StockSessionItem, qty: number | null) {
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
        <>
          <div className="space-y-6">
            {Object.entries(groupedItems).map(([location, items]) => (
              <div key={location}>
                <h2 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <span className="text-lg">📍</span>
                  {location || 'Non classé'}
                </h2>
                <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
                  {items.map((item) => (
                    <div key={item.id} className="p-3 flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{item.item.name}</div>
                        <div className="text-xs text-gray-500">
                          objectif: {item.item.targetQuantity} {item.item.unit}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDecrement(item)}
                          className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 font-bold text-xl transition-colors"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={item.countedQuantity ?? 0}
                          onChange={(e) => handleQuantityChange(item, e.target.value)}
                          className="w-14 h-10 px-1 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          onClick={() => handleIncrement(item)}
                          className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 font-bold text-xl transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <button
              onClick={handleContinue}
              disabled={transitioning}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {transitioning ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  Continuer vers les courses
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
