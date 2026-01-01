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
  createdAt: string
  updatedAt: string
}

export interface StockSession {
  id: string
  userId: string
  status: 'pre-shopping' | 'shopping' | 'completed'
  createdAt: string
  completedAt?: string
}

export interface StockSessionItem {
  id: string
  sessionId: string
  itemId: string
  countedQuantity: number | null
  toBuy: number
  purchased: boolean
  item: StockItem
}

export interface SessionWithItems extends StockSession {
  items: StockSessionItem[]
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
