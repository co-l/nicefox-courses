// Store constants
export const STORES = ['Billa', 'Lidl', 'Happy Market'] as const
export type Store = typeof STORES[number]

// Auth user type (matches nicefox-auth)
export interface AuthUser {
  id: string
  email: string
  role: 'user' | 'admin'
}

export interface StockItem {
  id: string
  userId: string
  name: string
  targetQuantity: number
  currentQuantity: number
  unit: string
  homeLocation: string
  homeOrder: number
  storeSection: string
  storeOrder: number
  isTemporary: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateItemRequest {
  name: string
  targetQuantity: number
  currentQuantity?: number
  unit: string
  homeLocation?: string
  storeSection?: string
}

export interface UpdateItemRequest {
  name?: string
  targetQuantity?: number
  currentQuantity?: number
  unit?: string
  homeLocation?: string
  homeOrder?: number
  storeSection?: string
  storeOrder?: number
}
