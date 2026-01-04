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
import { getItems, updateItem, reorderItems, deleteItem } from '../services/api'
import type { StockItem } from '../types'
import { SortableShoppingItem } from '../components/SortableShoppingItem'

interface ShoppingItem {
  item: StockItem
  toBuy: number
  purchased: boolean
}

export function Shopping() {
  const navigate = useNavigate()
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([])
  const [loading, setLoading] = useState(true)

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
    loadItems()
  }, [])

  async function loadItems() {
    try {
      const items = await getItems()
      // Build shopping list: items where currentQuantity < targetQuantity
      const toBuyItems: ShoppingItem[] = items
        .filter(item => item.currentQuantity < item.targetQuantity)
        .sort((a, b) => a.storeOrder - b.storeOrder)
        .map(item => ({
          item,
          toBuy: item.targetQuantity - item.currentQuantity,
          purchased: false, // Reset purchased state on load
        }))
      setShoppingItems(toBuyItems)
    } catch (error) {
      console.error('Failed to load items:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleTogglePurchased(shoppingItem: ShoppingItem) {
    const newPurchased = !shoppingItem.purchased
    
    // Optimistic update
    setShoppingItems((prev) =>
      prev.map((si) =>
        si.item.id === shoppingItem.item.id ? { ...si, purchased: newPurchased } : si
      )
    )

    // If marking as purchased, update currentQuantity to targetQuantity
    if (newPurchased) {
      try {
        await updateItem(shoppingItem.item.id, {
          currentQuantity: shoppingItem.item.targetQuantity,
        })
        // If it's a temporary item, delete it after purchase
        if (shoppingItem.item.isTemporary) {
          await deleteItem(shoppingItem.item.id)
        }
      } catch (error) {
        console.error('Failed to update item:', error)
        loadItems()
      }
    } else {
      // If unmarking, reset currentQuantity to what it was before (0 for simplicity)
      try {
        await updateItem(shoppingItem.item.id, {
          currentQuantity: shoppingItem.item.currentQuantity,
        })
      } catch (error) {
        console.error('Failed to update item:', error)
        loadItems()
      }
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = shoppingItems.findIndex((si) => si.item.id === active.id)
    const newIndex = shoppingItems.findIndex((si) => si.item.id === over.id)

    const reorderedItems = arrayMove(shoppingItems, oldIndex, newIndex)

    // Update local state optimistically - update storeOrder on the item
    const updatedShoppingItems = reorderedItems.map((si, index) => ({
      ...si,
      item: {
        ...si.item,
        storeOrder: index,
      },
    }))

    setShoppingItems(updatedShoppingItems)

    // Persist to server - update storeOrder on items
    try {
      await reorderItems(
        updatedShoppingItems.map((si) => ({
          id: si.item.id,
          storeOrder: si.item.storeOrder,
        }))
      )
    } catch (error) {
      console.error('Failed to reorder items:', error)
      loadItems()
    }
  }

  function handleDone() {
    navigate('/')
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const purchasedCount = shoppingItems.filter((si) => si.purchased).length
  const totalCount = shoppingItems.length

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Liste de courses</h1>
        <span className="text-sm font-medium text-gray-600">
          {purchasedCount}/{totalCount}
        </span>
      </div>

      {shoppingItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🎉</div>
          <p className="text-gray-600 mb-4">Rien à acheter !</p>
          <p className="text-sm text-gray-500 mb-6">
            Tous vos articles sont en stock.
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            Retour
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
              items={shoppingItems.map((si) => si.item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100 mb-6">
                {shoppingItems.map((shoppingItem) => (
                  <SortableShoppingItem
                    key={shoppingItem.item.id}
                    shoppingItem={shoppingItem}
                    onTogglePurchased={() => handleTogglePurchased(shoppingItem)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <button
            onClick={handleDone}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Terminer
          </button>
        </>
      )}
    </div>
  )
}
