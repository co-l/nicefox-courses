import axios, { InternalAxiosRequestConfig } from 'axios'
import type {
  AuthUser,
  StockItem,
  SessionWithItems,
  CreateItemRequest,
  UpdateItemRequest,
  StockSession,
  StockSessionItem,
} from '../types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3100/api'
const TOKEN_KEY = 'auth_token'

const api = axios.create({
  baseURL: API_URL,
})

// Request interceptor: add Authorization header from stored token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auth
export async function getMe(): Promise<AuthUser> {
  const { data } = await api.get('/auth/me')
  return data
}

// Items
export async function getItems(): Promise<StockItem[]> {
  const { data } = await api.get('/items')
  return data
}

export async function getItem(id: string): Promise<StockItem> {
  const { data } = await api.get(`/items/${id}`)
  return data
}

export async function createItem(item: CreateItemRequest): Promise<StockItem> {
  const { data } = await api.post('/items', item)
  return data
}

export async function updateItem(id: string, item: UpdateItemRequest): Promise<StockItem> {
  const { data } = await api.put(`/items/${id}`, item)
  return data
}

export async function deleteItem(id: string): Promise<void> {
  await api.delete(`/items/${id}`)
}

export async function reorderItems(
  items: { id: string; homeOrder?: number; storeOrder?: number }[]
): Promise<void> {
  await api.post('/items/reorder', { items })
}

export async function createTemporaryItem(name: string, quantity: number = 1, unit: string = 'unite(s)'): Promise<StockItem> {
  const { data } = await api.post('/items/temporary', { name, quantity, unit })
  return data
}

// Sessions
export async function getCurrentSession(): Promise<SessionWithItems | null> {
  try {
    const { data } = await api.get('/sessions/current')
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null
    }
    throw error
  }
}

export async function getSession(id: string): Promise<SessionWithItems> {
  const { data } = await api.get(`/sessions/${id}`)
  return data
}

export async function createSession(): Promise<SessionWithItems> {
  const { data } = await api.post('/sessions')
  return data
}

export async function updateSessionStatus(
  id: string,
  status: StockSession['status']
): Promise<StockSession> {
  const { data } = await api.patch(`/sessions/${id}/status`, { status })
  return data
}

export async function updateSessionItem(
  sessionId: string,
  itemId: string,
  update: { countedQuantity?: number | null; purchased?: boolean }
): Promise<StockSessionItem> {
  const { data } = await api.patch(`/sessions/${sessionId}/items/${itemId}`, update)
  return data
}

export async function completeSession(id: string): Promise<StockSession> {
  const { data } = await api.post(`/sessions/${id}/complete`)
  return data
}
