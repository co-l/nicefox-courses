import { useEffect, useState } from 'react'
import { Modal } from './Modal'
import { getItem, createItem, updateItem } from '../services/api'
import { STORES, type CreateItemRequest } from '../types'

interface ItemFormModalProps {
  isOpen: boolean
  onClose: () => void
  itemId: string | null // null = création, string = édition
  onSaved: () => void
}

export function ItemFormModal({ isOpen, onClose, itemId, onSaved }: ItemFormModalProps) {
  const isEditing = itemId !== null

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<CreateItemRequest>({
    name: '',
    targetQuantity: 1,
    currentQuantity: 0,
    unit: '',
    storeSection: STORES[0],
  })

  useEffect(() => {
    if (isOpen && isEditing) {
      loadItem()
    } else if (isOpen && !isEditing) {
      // Reset form pour la création
      setForm({
        name: '',
        targetQuantity: 1,
        currentQuantity: 0,
        unit: '',
        storeSection: STORES[0],
      })
    }
  }, [isOpen, itemId])

  async function loadItem() {
    setLoading(true)
    try {
      const item = await getItem(itemId!)
      setForm({
        name: item.name,
        targetQuantity: item.targetQuantity,
        currentQuantity: item.currentQuantity,
        unit: item.unit,
        storeSection: item.storeSection || STORES[0],
      })
    } catch (error) {
      console.error('Failed to load item:', error)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      if (isEditing) {
        await updateItem(itemId!, form)
      } else {
        await createItem(form)
      }
      onSaved()
      onClose()
    } catch (error: unknown) {
      console.error('Failed to save item:', error)
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string }, status?: number } }
        console.error('Response:', axiosError.response?.status, axiosError.response?.data)
        alert(`Erreur: ${axiosError.response?.data?.error || 'Erreur lors de la sauvegarde'}`)
      } else {
        alert('Erreur lors de la sauvegarde')
      }
    } finally {
      setSaving(false)
    }
  }

  const title = isEditing ? "Modifier l'element" : 'Nouvel element'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: Carottes"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Magasin
            </label>
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              {STORES.map((store) => (
                <button
                  key={store}
                  type="button"
                  onClick={() => setForm({ ...form, storeSection: store })}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    form.storeSection === store
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  } ${store !== STORES[0] ? 'border-l border-gray-300' : ''}`}
                >
                  {store}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantite cible
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.1"
                value={form.targetQuantity}
                onChange={(e) => setForm({ ...form, targetQuantity: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unite
              </label>
              <input
                type="text"
                required
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: kg, pieces"
              />
            </div>
          </div>

          {isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantite actuelle en stock
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={form.currentQuantity}
                onChange={(e) => setForm({ ...form, currentQuantity: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}
