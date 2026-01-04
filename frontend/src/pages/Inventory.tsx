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

interface SortableInventoryItemProps {
  item: StockItem
  onEdit: () => void
  onIncrement: () => void
  onDecrement: () => void
  onQuantityChange: (value: string) => void
}

function SortableInventoryItem({ item, onEdit, onIncrement, onDecrement, onQuantityChange }: SortableInventoryItemProps) {
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
      className={`p-3 flex items-center gap-2 ${isDragging ? 'opacity-50 bg-blue-50' : ''}`}
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

      <button
        onClick={onEdit}
        className="flex-1 min-w-0 text-left"
      >
        <div className="font-medium truncate">{item.name}</div>
        <div className="text-xs text-gray-500">
          objectif: {item.targetQuantity} {item.unit} · {item.storeSection || 'Aucun magasin'}
        </div>
      </button>
      <div className="flex items-center gap-1">
        <button
          onClick={onDecrement}
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 font-bold text-xl transition-colors"
        >
          -
        </button>
        <input
          type="number"
          min="0"
          step="0.1"
          value={item.currentQuantity}
          onChange={(e) => onQuantityChange(e.target.value)}
          className="w-14 h-10 px-1 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          onClick={onIncrement}
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 font-bold text-xl transition-colors"
        >
          +
        </button>
      </div>
    </div>
  )
}

export function Inventory() {
  const navigate = useNavigate()
  const [items, setItems] = useState<StockItem[]>([])
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
      const data = await getItems()
      // Filter out temporary items - they only appear in shopping list
      setItems(data.filter(i => !i.isTemporary))
    } catch (error) {
      console.error('Failed to load items:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleQuantityChange(item: StockItem, value: string) {
    const qty = value === '' ? 0 : parseFloat(value)
    await updateQuantity(item, qty)
  }

  async function handleIncrement(item: StockItem) {
    const step = item.unit === 'kg' ? 0.5 : 1
    await updateQuantity(item, item.currentQuantity + step)
  }

  async function handleDecrement(item: StockItem) {
    const step = item.unit === 'kg' ? 0.5 : 1
    const newQty = Math.max(0, item.currentQuantity - step)
    await updateQuantity(item, newQty)
  }

  async function updateQuantity(item: StockItem, qty: number) {
    // Optimistic update
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, currentQuantity: qty } : i
      )
    )

    try {
      await updateItem(item.id, { currentQuantity: qty })
    } catch (error) {
      console.error('Failed to update item:', error)
      loadItems()
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const sortedItems = [...items].sort((a, b) => a.homeOrder - b.homeOrder)
    const oldIndex = sortedItems.findIndex((item) => item.id === active.id)
    const newIndex = sortedItems.findIndex((item) => item.id === over.id)

    const reorderedItems = arrayMove(sortedItems, oldIndex, newIndex)

    // Update homeOrder for all items
    const updatedItems = reorderedItems.map((item, index) => ({
      ...item,
      homeOrder: index,
    }))

    setItems(updatedItems)

    // Persist to server
    try {
      await reorderItems(
        updatedItems.map((item) => ({
          id: item.id,
          homeOrder: item.homeOrder,
        }))
      )
    } catch (error) {
      console.error('Failed to reorder items:', error)
      loadItems()
    }
  }

  async function handleDeleteAll() {
    if (!confirm(`Supprimer les ${items.length} éléments ?`)) return
    try {
      for (const item of items) {
        await deleteItem(item.id)
      }
      setItems([])
    } catch (error) {
      console.error('Failed to delete all items:', error)
      loadItems()
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const sortedItems = [...items].sort((a, b) => a.homeOrder - b.homeOrder)

  return (
    <div>
      <div className="flex items-center justify-end gap-2 mb-4">
        {items.length > 0 && (
          <button
            onClick={handleDeleteAll}
            className="bg-red-50 hover:bg-red-100 text-red-600 font-medium py-2 px-3 rounded-lg transition-colors"
            title="Tout supprimer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
        <button
          onClick={() => navigate('/items/import')}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-3 rounded-lg transition-colors"
          title="Importer CSV"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </button>
        <button
          onClick={() => navigate('/items/new')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Ajouter
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>Aucun élément dans l'inventaire</p>
          <p className="text-sm mt-1">Ajoutez des éléments pour commencer</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-500 mb-2">Maintenez et glissez pour réordonner</p>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={sortedItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
                {sortedItems.map((item) => (
                  <SortableInventoryItem
                    key={item.id}
                    item={item}
                    onEdit={() => navigate(`/items/${item.id}`)}
                    onIncrement={() => handleIncrement(item)}
                    onDecrement={() => handleDecrement(item)}
                    onQuantityChange={(value) => handleQuantityChange(item, value)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </>
      )}
    </div>
  )
}
