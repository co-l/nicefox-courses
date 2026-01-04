import { getDb } from './graphdb.js'
import { v4 as uuidv4 } from 'uuid'
import type { StockSession, StockSessionItem, StockItem } from '../types/index.js'
import { deleteTemporaryItems } from './itemQueries.js'

export interface SessionWithItems extends StockSession {
  items: (StockSessionItem & { item: StockItem })[]
}

export async function findCurrentSession(userId: string): Promise<SessionWithItems | null> {
  const db = getDb()
  // Find sessions for user, then filter in JS
  const allSessions = await db.query<{ s: StockSession }>(
    `MATCH (s:Stock_Session {userId: $userId}) RETURN s`,
    { userId }
  )
  
  const activeSession = allSessions.find(r => r.s.status !== 'completed')
  if (!activeSession) return null

  const session = activeSession.s

  // Get session items
  const sessionItems = await db.query<{ si: StockSessionItem }>(
    `MATCH (si:Stock_SessionItem {sessionId: $sessionId}) RETURN si`,
    { sessionId: session.id }
  )

  // Get all items for user
  const allItems = await db.query<{ i: StockItem }>(
    `MATCH (i:Stock_Item {userId: $userId}) RETURN i`,
    { userId }
  )
  const itemsMap = new Map(allItems.map(r => [r.i.id, r.i]))

  return {
    ...session,
    items: sessionItems
      .map(r => ({
        ...r.si,
        item: itemsMap.get(r.si.itemId),
      }))
      .filter(item => item.item !== undefined) as (StockSessionItem & { item: StockItem })[],
  }
}

export async function findSessionById(id: string, userId: string): Promise<SessionWithItems | null> {
  const db = getDb()
  const sessionResult = await db.query<{ s: StockSession }>(
    `MATCH (s:Stock_Session {id: $id, userId: $userId}) RETURN s`,
    { id, userId }
  )

  if (!sessionResult[0]) return null

  const session = sessionResult[0].s

  // Get session items
  const sessionItems = await db.query<{ si: StockSessionItem }>(
    `MATCH (si:Stock_SessionItem {sessionId: $sessionId}) RETURN si`,
    { sessionId: session.id }
  )

  // Get all items for user
  const allItems = await db.query<{ i: StockItem }>(
    `MATCH (i:Stock_Item {userId: $userId}) RETURN i`,
    { userId }
  )
  const itemsMap = new Map(allItems.map(r => [r.i.id, r.i]))

  return {
    ...session,
    items: sessionItems
      .map(r => ({
        ...r.si,
        item: itemsMap.get(r.si.itemId),
      }))
      .filter(item => item.item !== undefined) as (StockSessionItem & { item: StockItem })[],
  }
}

export async function createSession(userId: string): Promise<SessionWithItems> {
  const db = getDb()
  const sessionId = uuidv4()
  const now = new Date().toISOString()

  // Create the session
  await db.execute(
    `CREATE (s:Stock_Session {id: $sessionId, userId: $userId, status: 'pre-shopping', createdAt: $now})`,
    { sessionId, userId, now }
  )

  // Get all items for this user
  const itemsResult = await db.query<{ i: StockItem }>(
    `MATCH (i:Stock_Item {userId: $userId}) RETURN i`,
    { userId }
  )

  // Create session items for each item (countedQuantity defaults to 0, toBuy = targetQuantity)
  for (const { i } of itemsResult) {
    const sessionItemId = uuidv4()
    const toBuy = i.targetQuantity || 0
    await db.execute(
      `CREATE (si:Stock_SessionItem {id: $id, sessionId: $sessionId, itemId: $itemId, countedQuantity: 0, toBuy: $toBuy, purchased: false})`,
      { id: sessionItemId, sessionId, itemId: i.id, toBuy }
    )
  }

  // Return the created session with items
  return (await findSessionById(sessionId, userId))!
}

export async function updateSessionStatus(
  id: string,
  userId: string,
  status: StockSession['status']
): Promise<StockSession | null> {
  const db = getDb()
  const result = await db.query<{ s: StockSession }>(
    `MATCH (s:Stock_Session {id: $id, userId: $userId}) SET s.status = $status RETURN s`,
    { id, userId, status }
  )
  return result[0]?.s || null
}

export async function updateSessionItem(
  sessionId: string,
  itemId: string,
  userId: string,
  data: { countedQuantity?: number | null; purchased?: boolean }
): Promise<StockSessionItem | null> {
  const db = getDb()
  // Verify session belongs to user
  const sessionCheck = await db.query<{ s: StockSession }>(
    `MATCH (s:Stock_Session {id: $sessionId, userId: $userId}) RETURN s`,
    { sessionId, userId }
  )
  if (!sessionCheck[0]) return null

  // Build SET clause
  const setClauses: string[] = []
  const params: Record<string, unknown> = { sessionId, itemId }

  if (data.countedQuantity !== undefined) {
    setClauses.push('si.countedQuantity = $countedQuantity')
    params.countedQuantity = data.countedQuantity

    // Calculate toBuy if countedQuantity is set
    if (data.countedQuantity !== null) {
      // Get target quantity from the item directly
      const itemResult = await db.query<{ i: StockItem }>(
        `MATCH (i:Stock_Item {id: $itemId}) RETURN i`,
        { itemId }
      )
      if (itemResult[0]) {
        const toBuy = Math.max(0, itemResult[0].i.targetQuantity - data.countedQuantity)
        setClauses.push('si.toBuy = $toBuy')
        params.toBuy = toBuy
      }
    }
  }

  if (data.purchased !== undefined) {
    setClauses.push('si.purchased = $purchased')
    params.purchased = data.purchased
  }

  if (setClauses.length === 0) return null

  const result = await db.query<{ si: StockSessionItem }>(
    `MATCH (si:Stock_SessionItem {sessionId: $sessionId, itemId: $itemId}) SET ${setClauses.join(', ')} RETURN si`,
    params
  )
  return result[0]?.si || null
}

export async function completeSession(id: string, userId: string): Promise<StockSession | null> {
  const db = getDb()
  // Verify session belongs to user
  const sessionCheck = await db.query<{ s: StockSession }>(
    `MATCH (s:Stock_Session {id: $id, userId: $userId}) RETURN s`,
    { id, userId }
  )
  if (!sessionCheck[0]) return null

  // Get all session items, filter in JS
  const allItems = await db.query<{ si: StockSessionItem }>(
    `MATCH (si:Stock_SessionItem {sessionId: $id}) RETURN si`,
    { id }
  )
  const purchasedItems = allItems.filter(r => r.si.purchased === true && r.si.toBuy > 0)

  // Update each item's currentQuantity
  const now = new Date().toISOString()
  for (const { si } of purchasedItems) {
    // Get current quantity first
    const itemResult = await db.query<{ i: StockItem }>(
      `MATCH (i:Stock_Item {id: $itemId}) RETURN i`,
      { itemId: si.itemId }
    )
    if (itemResult[0]) {
      const newQuantity = (itemResult[0].i.currentQuantity || 0) + si.toBuy
      await db.execute(
        `MATCH (i:Stock_Item {id: $itemId}) SET i.currentQuantity = $newQuantity, i.updatedAt = $now`,
        { itemId: si.itemId, newQuantity, now }
      )
    }
  }

  // Mark session as completed
  const result = await db.query<{ s: StockSession }>(
    `MATCH (s:Stock_Session {id: $id, userId: $userId}) SET s.status = 'completed', s.completedAt = $now RETURN s`,
    { id, userId, now }
  )

  // Delete temporary items after session completion
  await deleteTemporaryItems(userId)

  return result[0]?.s || null
}

export async function hasActiveSession(userId: string): Promise<boolean> {
  const db = getDb()
  const allSessions = await db.query<{ s: StockSession }>(
    `MATCH (s:Stock_Session {userId: $userId}) RETURN s`,
    { userId }
  )
  return allSessions.some(r => r.s.status !== 'completed')
}

export async function addSessionItemForItem(
  userId: string,
  itemId: string,
  quantity: number
): Promise<StockSessionItem | null> {
  const db = getDb()
  // Find active session
  const allSessions = await db.query<{ s: StockSession }>(
    `MATCH (s:Stock_Session {userId: $userId}) RETURN s`,
    { userId }
  )
  const activeSession = allSessions.find(r => r.s.status !== 'completed')
  if (!activeSession) return null

  const sessionId = activeSession.s.id
  const sessionItemId = uuidv4()

  await db.execute(
    `CREATE (si:Stock_SessionItem {id: $id, sessionId: $sessionId, itemId: $itemId, countedQuantity: 0, toBuy: $toBuy, purchased: false})`,
    { id: sessionItemId, sessionId, itemId, toBuy: quantity }
  )

  const result = await db.query<{ si: StockSessionItem }>(
    `MATCH (si:Stock_SessionItem {id: $id}) RETURN si`,
    { id: sessionItemId }
  )

  return result[0]?.si || null
}
