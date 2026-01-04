import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getItems, updateItem } from '../services/api'
import type { StockItem } from '../types'

export function Inventory() {
  const navigate = useNavigate()
  const [items, setItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)

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
      loadItems() // Reload on error
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Group items by homeLocation, sorted by homeOrder
  const sortedItems = [...items].sort((a, b) => a.homeOrder - b.homeOrder)
  const groupedItems = sortedItems.reduce((acc, item) => {
    const location = item.homeLocation
    if (!acc[location]) {
      acc[location] = []
    }
    acc[location].push(item)
    return acc
  }, {} as Record<string, StockItem[]>)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Inventaire</h1>
        <button
          onClick={() => navigate('/items')}
          className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Gérer les éléments
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>Aucun élément dans l'inventaire</p>
          <button
            onClick={() => navigate('/items/new')}
            className="mt-2 text-blue-600 hover:underline"
          >
            Ajouter des éléments
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedItems).map(([location, locationItems]) => (
            <div key={location}>
              <h2 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <span className="text-lg">📍</span>
                {location || 'Non classé'}
              </h2>
              <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
                {locationItems.map((item) => (
                  <div key={item.id} className="p-3 flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{item.name}</div>
                      <div className="text-xs text-gray-500">
                        objectif: {item.targetQuantity} {item.unit}
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
                        value={item.currentQuantity}
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
      )}
    </div>
  )
}
