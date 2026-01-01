import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { getCurrentSession, updateSessionItem, updateSessionStatus, completeSession, reorderItems } from '../services/api'
import type { SessionWithItems, StockSessionItem } from '../types'
import { SortableShoppingItem } from '../components/SortableShoppingItem'

export function Shopping() {
  const navigate = useNavigate()
  const [session, setSession] = useState<SessionWithItems | null>(null)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [goingBack, setGoingBack] = useState(false)

  // Sensors optimized for mobile touch
  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    }),
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

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

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id || !session) return

    const currentItemsToBuy = session.items
      .filter((i) => i.toBuy > 0)
      .sort((a, b) => a.item.storeOrder - b.item.storeOrder)

    const oldIndex = currentItemsToBuy.findIndex((item) => item.itemId === active.id)
    const newIndex = currentItemsToBuy.findIndex((item) => item.itemId === over.id)

    const reorderedItems = arrayMove(currentItemsToBuy, oldIndex, newIndex)

    // Update local state optimistically - update storeOrder on the item
    const updatedSessionItems = reorderedItems.map((sessionItem, index) => ({
      ...sessionItem,
      item: {
        ...sessionItem.item,
        storeOrder: index,
      },
    }))

    setSession((prev) => {
      if (!prev) return prev
      const otherItems = prev.items.filter((i) => i.toBuy <= 0)
      return {
        ...prev,
        items: [...updatedSessionItems, ...otherItems],
      }
    })

    // Persist to server - update storeOrder on items
    try {
      await reorderItems(
        updatedSessionItems.map((sessionItem) => ({
          id: sessionItem.itemId,
          storeOrder: sessionItem.item.storeOrder,
        }))
      )
    } catch (error) {
      console.error('Failed to reorder items:', error)
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
          {purchasedCount}/{totalCount}
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
          <p className="text-xs text-gray-500 mb-2">Maintenez et glissez pour réordonner</p>
          
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={itemsToBuy.map((i) => i.itemId)}
              strategy={verticalListSortingStrategy}
            >
              <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100 mb-6">
                {itemsToBuy.map((item) => (
                  <SortableShoppingItem
                    key={item.itemId}
                    item={item}
                    onTogglePurchased={() => handleTogglePurchased(item)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <button
            onClick={handleComplete}
            disabled={completing || goingBack}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
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
        </>
      )}
    </div>
  )
}
