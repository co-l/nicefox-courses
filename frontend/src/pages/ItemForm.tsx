import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getItem, createItem, updateItem } from '../services/api'
import type { CreateItemRequest } from '../types'

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
    homeLocation: '',
    storeSection: '',
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
        homeLocation: item.homeLocation,
        storeSection: item.storeSection,
      })
    } catch (error) {
      console.error('Failed to load item:', error)
      navigate('/items')
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
      navigate('/items')
    } catch (error) {
      console.error('Failed to save item:', error)
      alert('Erreur lors de la sauvegarde')
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Emplacement maison
          </label>
          <input
            type="text"
            required
            value={form.homeLocation}
            onChange={(e) => setForm({ ...form, homeLocation: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ex: Réfrigérateur"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rayon magasin
          </label>
          <input
            type="text"
            required
            value={form.storeSection}
            onChange={(e) => setForm({ ...form, storeSection: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ex: Fruits et légumes"
          />
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
            onClick={() => navigate('/items')}
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
