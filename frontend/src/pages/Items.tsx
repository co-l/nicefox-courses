import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
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
import { getItems, deleteItem, reorderItems } from '../services/api'
import type { StockItem } from '../types'
import { SortableItem } from '../components/SortableItem'

type SortMode = 'home' | 'store'

export function Items() {
  const navigate = useNavigate()
  const [items, setItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [sortMode, setSortMode] = useState<SortMode>('home')

  const sensors = useSensors(
    useSensor(PointerSensor),
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
      setItems(data)
    } catch (error) {
      console.error('Failed to load items:', error)
    } finally {
      setLoading(false)
    }
  }

  const sortedItems = [...items].sort((a, b) => {
    if (sortMode === 'home') {
      return a.homeOrder - b.homeOrder
    }
    return a.storeOrder - b.storeOrder
  })

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = sortedItems.findIndex((item) => item.id === active.id)
    const newIndex = sortedItems.findIndex((item) => item.id === over.id)

    const newSortedItems = arrayMove(sortedItems, oldIndex, newIndex)

    // Update local state optimistically
    const updatedItems = newSortedItems.map((item, index) => ({
      ...item,
      [sortMode === 'home' ? 'homeOrder' : 'storeOrder']: index,
    }))
    setItems(updatedItems)

    // Persist to server
    try {
      await reorderItems(
        updatedItems.map((item) => ({
          id: item.id,
          [sortMode === 'home' ? 'homeOrder' : 'storeOrder']: sortMode === 'home' ? item.homeOrder : item.storeOrder,
        }))
      )
    } catch (error) {
      console.error('Failed to reorder items:', error)
      loadItems() // Reload on error
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cet élément ?')) return
    try {
      await deleteItem(id)
      setItems(items.filter((item) => item.id !== id))
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
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Éléments</h1>
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

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSortMode('home')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            sortMode === 'home'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300'
          }`}
        >
          Ordre maison
        </button>
        <button
          onClick={() => setSortMode('store')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            sortMode === 'store'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300'
          }`}
        >
          Ordre magasin
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>Aucun élément</p>
          <p className="text-sm mt-1">Ajoutez des éléments pour commencer</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sortedItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {sortedItems.map((item) => (
                <SortableItem
                  key={item.id}
                  item={item}
                  sortMode={sortMode}
                  onEdit={() => navigate(`/items/${item.id}`)}
                  onDelete={() => handleDelete(item.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}
