import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getItems, updateItem, deleteItem } from '../services/api'
import type { StockItem } from '../types'
import { ShoppingItem } from '../components/ShoppingItem'

const STORES = ['Billa', 'Lidl', 'Happy Market'] as const

interface ShoppingItemData {
  item: StockItem
  toBuy: number
  purchased: boolean
}

export function Shopping() {
  const navigate = useNavigate()
  const [shoppingItems, setShoppingItems] = useState<ShoppingItemData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadItems()
  }, [])

  async function loadItems() {
    try {
      const items = await getItems()
      // Build shopping list: items where currentQuantity < targetQuantity
      const toBuyItems: ShoppingItemData[] = items
        .filter(item => item.currentQuantity < item.targetQuantity)
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
    items: shoppingItems.filter(si => si.item.storeSection === store),
  })).filter(group => group.items.length > 0)

  // Items without a store (or with an unknown store)
  const otherItems = shoppingItems.filter(
    si => !STORES.includes(si.item.storeSection as typeof STORES[number])
  )
  if (otherItems.length > 0) {
    groupedByStore.push({ store: 'Autre', items: otherItems })
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
          <div className="space-y-6 mb-6">
            {groupedByStore.map(({ store, items }) => (
              <div key={store}>
                <h2 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <span className="text-lg">🏪</span>
                  {store}
                </h2>
                <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
                  {items.map((shoppingItem) => (
                    <ShoppingItem
                      key={shoppingItem.item.id}
                      shoppingItem={shoppingItem}
                      onTogglePurchased={() => handleTogglePurchased(shoppingItem)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

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
