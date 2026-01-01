import { db } from './graphdb.js'
import { v4 as uuidv4 } from 'uuid'
import type { StockSession, StockSessionItem, StockItem } from '../types/index.js'

export interface SessionWithItems extends StockSession {
  items: (StockSessionItem & { item: StockItem })[]
}

export async function findCurrentSession(userId: string): Promise<SessionWithItems | null> {
  // Find session that is not completed
  const sessionResult = await db.query<{ s: StockSession }>(
    `MATCH (s:Stock_Session {userId: $userId})
     WHERE s.status <> 'completed'
     RETURN s
     ORDER BY s.createdAt DESC
     LIMIT 1`,
    { userId }
  )

  if (!sessionResult[0]) return null

  const session = sessionResult[0].s

  // Get session items with their associated items
  const itemsResult = await db.query<{ si: StockSessionItem; i: StockItem }>(
    `MATCH (si:Stock_SessionItem {sessionId: $sessionId})
     MATCH (i:Stock_Item {id: si.itemId})
     RETURN si, i`,
    { sessionId: session.id }
  )

  return {
    ...session,
    items: itemsResult.map(r => ({ ...r.si, item: r.i })),
  }
}

export async function findSessionById(id: string, userId: string): Promise<SessionWithItems | null> {
  const sessionResult = await db.query<{ s: StockSession }>(
    `MATCH (s:Stock_Session {id: $id, userId: $userId}) RETURN s`,
    { id, userId }
  )

  if (!sessionResult[0]) return null

  const session = sessionResult[0].s

  const itemsResult = await db.query<{ si: StockSessionItem; i: StockItem }>(
    `MATCH (si:Stock_SessionItem {sessionId: $sessionId})
     MATCH (i:Stock_Item {id: si.itemId})
     RETURN si, i`,
    { sessionId: session.id }
  )

  return {
    ...session,
    items: itemsResult.map(r => ({ ...r.si, item: r.i })),
  }
}

export async function createSession(userId: string): Promise<SessionWithItems> {
  const sessionId = uuidv4()

  // Create the session
  await db.execute(
    `CREATE (s:Stock_Session {
      id: $sessionId,
      userId: $userId,
      status: 'pre-shopping',
      createdAt: datetime()
    })`,
    { sessionId, userId }
  )

  // Get all items for this user
  const itemsResult = await db.query<{ i: StockItem }>(
    `MATCH (i:Stock_Item {userId: $userId}) RETURN i`,
    { userId }
  )

  // Create session items for each item
  for (const { i } of itemsResult) {
    const sessionItemId = uuidv4()
    await db.execute(
      `CREATE (si:Stock_SessionItem {
        id: $id,
        sessionId: $sessionId,
        itemId: $itemId,
        countedQuantity: null,
        toBuy: 0,
        purchased: false
      })`,
      { id: sessionItemId, sessionId, itemId: i.id }
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
  const result = await db.query<{ s: StockSession }>(
    `MATCH (s:Stock_Session {id: $id, userId: $userId})
     SET s.status = $status
     RETURN s`,
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
      // Get target quantity from the item
      const itemResult = await db.query<{ i: StockItem }>(
        `MATCH (si:Stock_SessionItem {sessionId: $sessionId, itemId: $itemId})
         MATCH (i:Stock_Item {id: si.itemId})
         RETURN i`,
        { sessionId, itemId }
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
    `MATCH (si:Stock_SessionItem {sessionId: $sessionId, itemId: $itemId})
     SET ${setClauses.join(', ')}
     RETURN si`,
    params
  )
  return result[0]?.si || null
}

export async function completeSession(id: string, userId: string): Promise<StockSession | null> {
  // Update stock for purchased items
  const purchasedItems = await db.query<{ si: StockSessionItem }>(
    `MATCH (s:Stock_Session {id: $id, userId: $userId})
     MATCH (si:Stock_SessionItem {sessionId: $id})
     WHERE si.purchased = true AND si.toBuy > 0
     RETURN si`,
    { id, userId }
  )

  // Update each item's currentQuantity
  for (const { si } of purchasedItems) {
    await db.execute(
      `MATCH (i:Stock_Item {id: $itemId})
       SET i.currentQuantity = i.currentQuantity + $toBuy,
           i.updatedAt = datetime()`,
      { itemId: si.itemId, toBuy: si.toBuy }
    )
  }

  // Mark session as completed
  const result = await db.query<{ s: StockSession }>(
    `MATCH (s:Stock_Session {id: $id, userId: $userId})
     SET s.status = 'completed', s.completedAt = datetime()
     RETURN s`,
    { id, userId }
  )

  return result[0]?.s || null
}

export async function hasActiveSession(userId: string): Promise<boolean> {
  const result = await db.query<{ count: number }>(
    `MATCH (s:Stock_Session {userId: $userId})
     WHERE s.status <> 'completed'
     RETURN count(s) AS count`,
    { userId }
  )
  return (result[0]?.count ?? 0) > 0
}
