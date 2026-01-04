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

// Extend Express Request (authUser is already extended by nicefox-auth)
declare global {
  namespace Express {
    interface Request {
      stockUser?: StockUser
    }
  }
}
