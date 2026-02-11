// Re-export auth types from nicefox-auth
export type { AuthUser } from 'nicefox-auth'

// Domain types
export interface StockUser {
  id: string
  authUserId: string
  email?: string
  createdAt: string
}

export type AccountShareStatus = 'pending' | 'accepted' | 'refused' | 'cancelled' | 'stopped'

export interface AccountShare {
  id: string
  ownerUserId: string
  ownerAuthUserId: string
  ownerEmail: string
  targetEmail: string
  status: AccountShareStatus
  targetAuthUserId?: string
  targetUserId?: string
  createdAt: string
  updatedAt: string
  respondedAt?: string
  stoppedAt?: string
}

export interface AccountShareStatusView {
  role: 'none' | 'owner' | 'target'
  effectiveOwnerUserId: string
  partnerEmail: string | null
  outgoingRequest: AccountShare | null
  incomingRequests: AccountShare[]
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

export interface ReorderItemsRequest {
  items: { id: string; homeOrder?: number; storeOrder?: number }[]
}

// Extend Express Request (authUser is already extended by nicefox-auth)
declare global {
  namespace Express {
    interface Request {
      stockUser?: StockUser
      actorStockUser?: StockUser
    }
  }
}
