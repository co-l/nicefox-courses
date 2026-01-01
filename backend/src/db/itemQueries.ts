import { db } from './graphdb.js'
import { v4 as uuidv4 } from 'uuid'
import type { StockItem, CreateItemRequest, UpdateItemRequest } from '../types/index.js'

interface NodeResult<T> {
  id: string
  label: string
  properties: T
}

export async function findAllItems(userId: string): Promise<StockItem[]> {
  const result = await db.query<{ i: NodeResult<StockItem> }>(
    `MATCH (i:Stock_Item {userId: $userId}) RETURN i`,
    { userId }
  )
  // Sort in JS since ORDER BY n.prop not supported
  return result.map(r => r.i.properties).sort((a, b) => a.homeOrder - b.homeOrder)
}

export async function findItemById(id: string, userId: string): Promise<StockItem | null> {
  const result = await db.query<{ i: NodeResult<StockItem> }>(
    `MATCH (i:Stock_Item {id: $id, userId: $userId}) RETURN i`,
    { id, userId }
  )
  return result[0]?.i?.properties || null
}

export async function getNextOrders(userId: string): Promise<{ homeOrder: number; storeOrder: number }> {
  const result = await db.query<{ maxHome: number | null; maxStore: number | null }>(
    `MATCH (i:Stock_Item {userId: $userId})
     RETURN max(i.homeOrder) AS maxHome, max(i.storeOrder) AS maxStore`,
    { userId }
  )
  const maxHome = result[0]?.maxHome ?? -1
  const maxStore = result[0]?.maxStore ?? -1
  return {
    homeOrder: maxHome + 1,
    storeOrder: maxStore + 1,
  }
}

export async function createItem(userId: string, data: CreateItemRequest): Promise<StockItem> {
  const id = uuidv4()
  const { homeOrder, storeOrder } = await getNextOrders(userId)
  const now = new Date().toISOString()

  const result = await db.query<{ i: NodeResult<StockItem> }>(
    `CREATE (i:Stock_Item {id: $id, userId: $userId, name: $name, targetQuantity: $targetQuantity, currentQuantity: $currentQuantity, unit: $unit, homeLocation: $homeLocation, homeOrder: $homeOrder, storeSection: $storeSection, storeOrder: $storeOrder, isTemporary: $isTemporary, createdAt: $now, updatedAt: $now}) RETURN i`,
    {
      id,
      userId,
      name: data.name,
      targetQuantity: data.targetQuantity,
      currentQuantity: data.currentQuantity ?? 0,
      unit: data.unit,
      homeLocation: data.homeLocation || '',
      homeOrder,
      storeSection: data.storeSection || '',
      storeOrder,
      isTemporary: data.isTemporary ?? false,
      now,
    }
  )
  return result[0].i.properties
}

export async function updateItem(id: string, userId: string, data: UpdateItemRequest): Promise<StockItem | null> {
  // Build dynamic SET clause
  const now = new Date().toISOString()
  const setClauses: string[] = ['i.updatedAt = $now']
  const params: Record<string, unknown> = { id, userId }

  if (data.name !== undefined) {
    setClauses.push('i.name = $name')
    params.name = data.name
  }
  if (data.targetQuantity !== undefined) {
    setClauses.push('i.targetQuantity = $targetQuantity')
    params.targetQuantity = data.targetQuantity
  }
  if (data.currentQuantity !== undefined) {
    setClauses.push('i.currentQuantity = $currentQuantity')
    params.currentQuantity = data.currentQuantity
  }
  if (data.unit !== undefined) {
    setClauses.push('i.unit = $unit')
    params.unit = data.unit
  }
  if (data.homeLocation !== undefined) {
    setClauses.push('i.homeLocation = $homeLocation')
    params.homeLocation = data.homeLocation
  }
  if (data.homeOrder !== undefined) {
    setClauses.push('i.homeOrder = $homeOrder')
    params.homeOrder = data.homeOrder
  }
  if (data.storeSection !== undefined) {
    setClauses.push('i.storeSection = $storeSection')
    params.storeSection = data.storeSection
  }
  if (data.storeOrder !== undefined) {
    setClauses.push('i.storeOrder = $storeOrder')
    params.storeOrder = data.storeOrder
  }

  params.now = now
  const result = await db.query<{ i: NodeResult<StockItem> }>(
    `MATCH (i:Stock_Item {id: $id, userId: $userId}) SET ${setClauses.join(', ')} RETURN i`,
    params
  )
  return result[0]?.i?.properties || null
}

export async function deleteItem(id: string, userId: string): Promise<boolean> {
  // Check if item exists first
  const existing = await findItemById(id, userId)
  if (!existing) return false
  
  await db.execute(
    `MATCH (i:Stock_Item {id: $id, userId: $userId}) DETACH DELETE i`,
    { id, userId }
  )
  return true
}

export async function reorderItems(
  userId: string,
  items: { id: string; homeOrder?: number; storeOrder?: number }[]
): Promise<void> {
  for (const item of items) {
    const updates: UpdateItemRequest = {}
    if (item.homeOrder !== undefined) updates.homeOrder = item.homeOrder
    if (item.storeOrder !== undefined) updates.storeOrder = item.storeOrder
    if (Object.keys(updates).length > 0) {
      await updateItem(item.id, userId, updates)
    }
  }
}

export async function deleteTemporaryItems(userId: string): Promise<void> {
  // Get all temporary items first (can't filter in WHERE)
  const result = await db.query<{ i: NodeResult<StockItem> }>(
    `MATCH (i:Stock_Item {userId: $userId}) RETURN i`,
    { userId }
  )
  const temporaryItems = result.filter(r => r.i.properties.isTemporary === true)
  
  for (const { i } of temporaryItems) {
    await db.execute(
      `MATCH (i:Stock_Item {id: $id}) DETACH DELETE i`,
      { id: i.properties.id }
    )
  }
}
