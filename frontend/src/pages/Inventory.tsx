import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getItems, updateItem, deleteItem } from '../services/api'
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
        <div className="flex gap-2">
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
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>Aucun élément dans l'inventaire</p>
          <p className="text-sm mt-1">Ajoutez des éléments pour commencer</p>
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
                    <button
                      onClick={() => navigate(`/items/${item.id}`)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <div className="font-medium truncate">{item.name}</div>
                      <div className="text-xs text-gray-500">
                        objectif: {item.targetQuantity} {item.unit} · {item.storeSection || 'Aucun magasin'}
                      </div>
                    </button>
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
