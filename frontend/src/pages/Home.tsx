import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createTemporaryItem, getItems, deleteItem } from '../services/api'
import type { StockItem } from '../types'

type Unit = 'kg' | 'unité(s)'

export function Home() {
  const navigate = useNavigate()
  const [temporaryItems, setTemporaryItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [tempItemName, setTempItemName] = useState('')
  const [tempItemQuantity, setTempItemQuantity] = useState('1')
  const [tempItemUnit, setTempItemUnit] = useState<Unit>('unité(s)')
  const [addingItem, setAddingItem] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const items = await getItems()
      setTemporaryItems(items.filter(i => i.isTemporary))
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTemporaryItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tempItemName.trim() || addingItem) return

    const quantity = parseFloat(tempItemQuantity) || 1

    setAddingItem(true)
    try {
      const item = await createTemporaryItem(tempItemName.trim(), quantity, tempItemUnit)
      setTemporaryItems(prev => [...prev, item])
      setTempItemName('')
      setTempItemQuantity('1')
      setTempItemUnit('unité(s)')
    } catch (error) {
      console.error('Failed to add temporary item:', error)
      alert('Erreur lors de l\'ajout')
    } finally {
      setAddingItem(false)
    }
  }

  const handleDeleteTemporaryItem = async (id: string) => {
    try {
      await deleteItem(id)
      setTemporaryItems(prev => prev.filter(i => i.id !== id))
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
    <div className="space-y-6">
      {/* Navigation buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate('/inventory')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 px-4 rounded-lg transition-colors flex flex-col items-center gap-2"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          Inventaire
        </button>
        <button
          onClick={() => navigate('/shopping')}
          className="bg-green-600 hover:bg-green-700 text-white font-medium py-4 px-4 rounded-lg transition-colors flex flex-col items-center gap-2"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Liste de courses
        </button>
      </div>

      {/* Temporary items section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-sm font-medium text-gray-700 mb-3">Ajouter pour les prochaines courses</h2>
        
        {/* List of temporary items */}
        {temporaryItems.length > 0 && (
          <div className="mb-4 divide-y divide-gray-100">
            {temporaryItems.map(item => (
              <div key={item.id} className="flex items-center justify-between py-2">
                <span className="text-gray-900">{item.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">
                    {item.targetQuantity} {item.unit}
                  </span>
                  <button
                    onClick={() => handleDeleteTemporaryItem(item.id)}
                    className="text-gray-400 hover:text-red-600 p-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add form */}
        <form onSubmit={handleAddTemporaryItem} className="space-y-3">
          <input
            type="text"
            value={tempItemName}
            onChange={(e) => setTempItemName(e.target.value)}
            placeholder="Ex: Ampoules, Piles..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
          />
          <div className="flex gap-2">
            <input
              type="number"
              value={tempItemQuantity}
              onChange={(e) => setTempItemQuantity(e.target.value)}
              min="0.1"
              step="0.1"
              className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base text-center"
            />
            <div className="flex-1 flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                type="button"
                onClick={() => setTempItemUnit('unité(s)')}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  tempItemUnit === 'unité(s)'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                unité(s)
              </button>
              <button
                type="button"
                onClick={() => setTempItemUnit('kg')}
                className={`flex-1 py-2 text-sm font-medium transition-colors border-l border-gray-300 ${
                  tempItemUnit === 'kg'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                kg
              </button>
            </div>
            <button
              type="submit"
              disabled={!tempItemName.trim() || addingItem}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {addingItem ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              )}
            </button>
          </div>
        </form>
        <p className="text-xs text-gray-500 mt-3">
          Ces articles seront supprimés une fois achetés
        </p>
      </div>
    </div>
  )
}
