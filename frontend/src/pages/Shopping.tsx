import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentSession, updateSessionItem, updateSessionStatus, completeSession } from '../services/api'
import type { SessionWithItems, StockSessionItem } from '../types'

export function Shopping() {
  const navigate = useNavigate()
  const [session, setSession] = useState<SessionWithItems | null>(null)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [goingBack, setGoingBack] = useState(false)

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
      if (data.status === 'pre-shopping') {
        navigate('/pre-shopping')
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

  async function handleTogglePurchased(item: StockSessionItem) {
    // Optimistic update
    setSession((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        items: prev.items.map((i) =>
          i.itemId === item.itemId ? { ...i, purchased: !i.purchased } : i
        ),
      }
    })

    try {
      await updateSessionItem(session!.id, item.itemId, { purchased: !item.purchased })
    } catch (error) {
      console.error('Failed to update item:', error)
      loadSession()
    }
  }

  async function handleGoBack() {
    if (!session) return
    setGoingBack(true)
    try {
      await updateSessionStatus(session.id, 'pre-shopping')
      navigate('/pre-shopping')
    } catch (error) {
      console.error('Failed to go back:', error)
      setGoingBack(false)
    }
  }

  async function handleComplete() {
    if (!session) return
    setCompleting(true)
    try {
      await completeSession(session.id)
      navigate('/')
    } catch (error) {
      console.error('Failed to complete session:', error)
      setCompleting(false)
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

  // Filter items with toBuy > 0, sorted by storeOrder
  const itemsToBuy = session.items
    .filter((i) => i.toBuy > 0)
    .sort((a, b) => a.item.storeOrder - b.item.storeOrder)

  // Group by storeSection
  const groupedItems = itemsToBuy.reduce((acc, item) => {
    const section = item.item.storeSection
    if (!acc[section]) {
      acc[section] = []
    }
    acc[section].push(item)
    return acc
  }, {} as Record<string, StockSessionItem[]>)

  const purchasedCount = itemsToBuy.filter((i) => i.purchased).length
  const totalCount = itemsToBuy.length

  return (
    <div>
      <button
        onClick={handleGoBack}
        disabled={goingBack}
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Inventaire
      </button>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Liste de courses</h1>
        <span className="text-sm font-medium text-gray-600">
          {purchasedCount}/{totalCount} ✓
        </span>
      </div>

      {itemsToBuy.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🎉</div>
          <p className="text-gray-600 mb-4">Rien à acheter !</p>
          <button
            onClick={handleComplete}
            disabled={completing}
            className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            {completing ? 'Finalisation...' : 'Terminer'}
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-6 mb-6">
            {Object.entries(groupedItems).map(([section, items]) => (
              <div key={section}>
                <h2 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <span className="text-lg">🛒</span>
                  {section}
                </h2>
                <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleTogglePurchased(item)}
                      className="w-full p-3 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div
                        className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                          item.purchased
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300'
                        }`}
                      >
                        {item.purchased && (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={item.purchased ? 'line-through text-gray-400' : ''}>
                          {item.item.name}
                        </span>
                      </div>
                      <span className={`text-sm ${item.purchased ? 'text-gray-400' : 'text-gray-600'}`}>
                        {item.toBuy} {item.item.unit}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleGoBack}
              disabled={goingBack || completing}
              className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-100 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {goingBack ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500"></div>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Inventaire
                </>
              )}
            </button>
            <button
              onClick={handleComplete}
              disabled={completing || goingBack}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {completing ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Terminer
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
