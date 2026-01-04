import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getItem, createItem, updateItem } from '../services/api'
import { STORES, type CreateItemRequest } from '../types'

export function ItemForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditing = id && id !== 'new'

  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<CreateItemRequest>({
    name: '',
    targetQuantity: 1,
    currentQuantity: 0,
    unit: '',
    storeSection: STORES[0],
  })

  useEffect(() => {
    if (isEditing) {
      loadItem()
    }
  }, [id])

  async function loadItem() {
    try {
      const item = await getItem(id!)
      setForm({
        name: item.name,
        targetQuantity: item.targetQuantity,
        currentQuantity: item.currentQuantity,
        unit: item.unit,
        storeSection: item.storeSection || STORES[0],
      })
    } catch (error) {
      console.error('Failed to load item:', error)
      navigate('/inventory')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      if (isEditing) {
        await updateItem(id!, form)
      } else {
        await createItem(form)
      }
      navigate('/inventory')
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

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">
        {isEditing ? 'Modifier l\'élément' : 'Nouvel élément'}
      </h1>

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
              Quantité cible
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
              Unité
            </label>
            <input
              type="text"
              required
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: kg, pièces"
            />
          </div>
        </div>



        {isEditing && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantité actuelle en stock
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
            onClick={() => navigate('/inventory')}
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
    </div>
  )
}
