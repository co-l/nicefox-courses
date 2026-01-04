import type { StockItem } from '../types'

interface ShoppingItemData {
  item: StockItem
  toBuy: number
  purchased: boolean
}

interface ShoppingItemProps {
  shoppingItem: ShoppingItemData
  onTogglePurchased: () => void
}

export function ShoppingItem({ shoppingItem, onTogglePurchased }: ShoppingItemProps) {
  const { item, toBuy, purchased } = shoppingItem

  return (
    <button
      onClick={onTogglePurchased}
      className="w-full flex items-center gap-3 p-3 text-left"
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
      <span className={`flex-1 truncate ${purchased ? 'line-through text-gray-400' : ''}`}>
        {item.name}
      </span>
      <span className={`text-sm whitespace-nowrap ${purchased ? 'text-gray-400' : 'text-gray-600'}`}>
        {toBuy} {item.unit}
      </span>
    </button>
  )
}
