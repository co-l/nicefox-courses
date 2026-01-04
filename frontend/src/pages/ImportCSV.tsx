import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { createItem } from '../services/api'

interface ParsedItem {
  name: string
  targetQuantity: number
  order: number
}

function parseCSV(content: string): ParsedItem[] {
  const lines = content.trim().split('\n')
  if (lines.length < 2) return []

  // Skip header
  const items: ParsedItem[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    // Simple CSV parsing (handle commas in quoted strings)
    const parts = line.split(',')
    
    const name = parts[0]?.trim()
    const order = parseInt(parts[1]?.trim() || '0', 10) || 0
    const targetQuantity = parseInt(parts[2]?.trim() || '1', 10) || 1

    if (name) {
      items.push({ name, targetQuantity, order })
    }
  }

  return items
}

export function ImportCSV() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([])
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      const items = parseCSV(content)
      setParsedItems(items)
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    setImporting(true)
    setProgress(0)

    for (let i = 0; i < parsedItems.length; i++) {
      const item = parsedItems[i]
      try {
        await createItem({
          name: item.name,
          targetQuantity: item.targetQuantity,
          unit: 'pcs',
        })
      } catch (error) {
        console.error('Failed to import item:', item.name, error)
      }
      setProgress(i + 1)
    }

    setImporting(false)
    navigate('/inventory')
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Importer un CSV</h1>

      <div className="mb-6">
        <p className="text-sm text-gray-600 mb-2">
          Format attendu : Item, Ordre, Objectif, ...
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {parsedItems.length > 0 && (
        <>
          <div className="mb-4">
            <h2 className="font-medium mb-2">{parsedItems.length} éléments trouvés</h2>
            <div className="max-h-64 overflow-y-auto bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
              {parsedItems.map((item, index) => (
                <div key={index} className="px-3 py-2 text-sm">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-gray-500 ml-2">× {item.targetQuantity}</span>
                </div>
              ))}
            </div>
          </div>

          {importing && (
            <div className="mb-4">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{ width: `${(progress / parsedItems.length) * 100}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {progress} / {parsedItems.length}
              </p>
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={importing}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            {importing ? 'Import en cours...' : 'Importer'}
          </button>
        </>
      )}
    </div>
  )
}
