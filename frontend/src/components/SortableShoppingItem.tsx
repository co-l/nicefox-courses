import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { StockItem } from '../types'

interface ShoppingItem {
  item: StockItem
  toBuy: number
  purchased: boolean
}

interface SortableShoppingItemProps {
  shoppingItem: ShoppingItem
  onTogglePurchased: () => void
}

export function SortableShoppingItem({ shoppingItem, onTogglePurchased }: SortableShoppingItemProps) {
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
      {/* Drag handle - large touch target for mobile */}
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

      {/* Checkbox + item name - clickable area */}
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
