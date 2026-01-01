import * as sessionQueries from '../db/sessionQueries.js'
import type { StockSession, StockSessionItem } from '../types/index.js'

export async function getCurrentSession(userId: string) {
  return sessionQueries.findCurrentSession(userId)
}

export async function getSessionById(id: string, userId: string) {
  return sessionQueries.findSessionById(id, userId)
}

export async function createSession(userId: string) {
  // Check if there's already an active session
  const hasActive = await sessionQueries.hasActiveSession(userId)
  if (hasActive) {
    throw new Error('An active session already exists')
  }
  return sessionQueries.createSession(userId)
}

export async function updateSessionStatus(
  id: string,
  userId: string,
  status: StockSession['status']
): Promise<StockSession | null> {
  return sessionQueries.updateSessionStatus(id, userId, status)
}

export async function updateSessionItem(
  sessionId: string,
  itemId: string,
  userId: string,
  data: { countedQuantity?: number | null; purchased?: boolean }
): Promise<StockSessionItem | null> {
  return sessionQueries.updateSessionItem(sessionId, itemId, userId, data)
}

export async function completeSession(id: string, userId: string): Promise<StockSession | null> {
  return sessionQueries.completeSession(id, userId)
}

export async function addSessionItemForItem(
  userId: string,
  itemId: string,
  quantity: number
) {
  return sessionQueries.addSessionItemForItem(userId, itemId, quantity)
}
