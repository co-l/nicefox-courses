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
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { getItems, updateItem, deleteItem, reorderItems } from '../services/api'
import type { StockItem } from '../types'

const STORES = ['Billa', 'Lidl', 'Happy Market'] as const

interface ShoppingItemData {
  item: StockItem
  toBuy: number
  purchased: boolean
}

interface SortableShoppingItemProps {
  shoppingItem: ShoppingItemData
  onTogglePurchased: () => void
}

function SortableShoppingItem({ shoppingItem, onTogglePurchased }: SortableShoppingItemProps) {
  const { item, toBuy, purchased } = shoppingItem
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-3 ${isDragging ? 'opacity-50 bg-blue-50' : ''}`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing touch-none p-2 -m-2"
        aria-label="Réordonner"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </button>

      {/* Checkbox + item name */}
      <button
        onClick={onTogglePurchased}
        className="flex-1 flex items-center gap-3 text-left min-w-0"
      >
        <div
          className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
            purchased
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-gray-300'
          }`}
        >
          {purchased && (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <span className={`truncate ${purchased ? 'line-through text-gray-400' : ''}`}>
          {item.name}
        </span>
      </button>

      {/* Quantity */}
      <span className={`text-sm whitespace-nowrap ${purchased ? 'text-gray-400' : 'text-gray-600'}`}>
        {toBuy} {item.unit}
      </span>
    </div>
  )
}

export function Shopping() {
  const navigate = useNavigate()
  const [shoppingItems, setShoppingItems] = useState<ShoppingItemData[]>([])
  const [loading, setLoading] = useState(true)

  // Touch-optimized sensors
  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
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
      // Sort by storeOrder within each store
      const toBuyItems: ShoppingItemData[] = items
        .filter(item => item.currentQuantity < item.targetQuantity)
        .sort((a, b) => a.storeOrder - b.storeOrder)
        .map(item => ({
          item,
          toBuy: item.targetQuantity - item.currentQuantity,
          purchased: false,
        }))
      setShoppingItems(toBuyItems)
    } catch (error) {
      console.error('Failed to load items:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleTogglePurchased(shoppingItem: ShoppingItemData) {
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
      // If unmarking, reset currentQuantity to what it was before
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

    // Find the items being moved
    const activeItem = shoppingItems.find(si => si.item.id === active.id)
    const overItem = shoppingItems.find(si => si.item.id === over.id)
    if (!activeItem || !overItem) return

    // Only allow reordering within the same store
    if (activeItem.item.storeSection !== overItem.item.storeSection) return

    const store = activeItem.item.storeSection
    const storeItems = shoppingItems
      .filter(si => si.item.storeSection === store)
      .sort((a, b) => a.item.storeOrder - b.item.storeOrder)

    const oldIndex = storeItems.findIndex(si => si.item.id === active.id)
    const newIndex = storeItems.findIndex(si => si.item.id === over.id)

    const reorderedStoreItems = arrayMove(storeItems, oldIndex, newIndex)

    // Update storeOrder for reordered items
    const updatedStoreItems = reorderedStoreItems.map((si, index) => ({
      ...si,
      item: { ...si.item, storeOrder: index },
    }))

    // Merge back with other store items
    const otherItems = shoppingItems.filter(si => si.item.storeSection !== store)
    setShoppingItems([...otherItems, ...updatedStoreItems])

    // Persist to server
    try {
      await reorderItems(
        updatedStoreItems.map((si) => ({
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

  // Group items by store in the defined order
  const groupedByStore: { store: string; items: ShoppingItemData[] }[] = STORES.map(store => ({
    store,
    items: shoppingItems
      .filter(si => si.item.storeSection === store)
      .sort((a, b) => a.item.storeOrder - b.item.storeOrder),
  })).filter(group => group.items.length > 0)

  // Items without a store (or with an unknown store)
  const otherItems = shoppingItems
    .filter(si => !STORES.includes(si.item.storeSection as typeof STORES[number]))
    .sort((a, b) => a.item.storeOrder - b.item.storeOrder)
  if (otherItems.length > 0) {
    groupedByStore.push({ store: 'Autre', items: otherItems })
  }

  const purchasedCount = shoppingItems.filter((si) => si.purchased).length
  const totalCount = shoppingItems.length

  return (
    <div>
      {totalCount > 0 && (
        <div className="flex items-center justify-end mb-4">
          <span className="text-sm font-medium text-gray-600">
            {purchasedCount}/{totalCount}
          </span>
        </div>
      )}

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
            <div className="space-y-6 mb-6">
              {groupedByStore.map(({ store, items }) => (
                <div key={store}>
                  <h2 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <span className="text-lg">🏪</span>
                    {store}
                  </h2>
                  <SortableContext items={items.map(si => si.item.id)} strategy={verticalListSortingStrategy}>
                    <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
                      {items.map((shoppingItem) => (
                        <SortableShoppingItem
                          key={shoppingItem.item.id}
                          shoppingItem={shoppingItem}
                          onTogglePurchased={() => handleTogglePurchased(shoppingItem)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </div>
              ))}
            </div>
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
