// Re-export auth types from nicefox-auth
export type { AuthUser } from 'nicefox-auth'

// Domain types
export interface StockUser {
  id: string
  authUserId: string
  createdAt: string
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
}

// API request/response types
export interface CreateItemRequest {
  name: string
  targetQuantity: number
  currentQuantity?: number
  unit: string
  homeLocation?: string
  storeSection?: string
  isTemporary?: boolean
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

export interface ReorderItemsRequest {
  items: { id: string; homeOrder?: number; storeOrder?: number }[]
}

export interface UpdateSessionItemRequest {
  countedQuantity?: number | null
  purchased?: boolean
}

// Extend Express Request (authUser is already extended by nicefox-auth)
declare global {
  namespace Express {
    interface Request {
      stockUser?: StockUser
    }
  }
}
