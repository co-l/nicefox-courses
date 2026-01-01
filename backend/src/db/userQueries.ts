import { db } from './graphdb.js'
import { v4 as uuidv4 } from 'uuid'
import type { StockUser } from '../types/index.js'

interface NodeResult<T> {
  id: string
  label: string
  properties: T
}

export async function findUserByAuthId(authUserId: string): Promise<StockUser | null> {
  const result = await db.query<{ u: NodeResult<StockUser> }>(
    `MATCH (u:Stock_User {authUserId: $authUserId}) RETURN u`,
    { authUserId }
  )
  return result[0]?.u?.properties || null
}

export async function createUser(authUserId: string): Promise<StockUser> {
  const id = uuidv4()
  const now = new Date().toISOString()
  const result = await db.query<{ u: NodeResult<StockUser> }>(
    `CREATE (u:Stock_User {id: $id, authUserId: $authUserId, createdAt: $now}) RETURN u`,
    { id, authUserId, now }
  )
  return result[0].u.properties
}

export async function getOrCreateUser(authUserId: string): Promise<StockUser> {
  const existing = await findUserByAuthId(authUserId)
  if (existing) return existing
  return createUser(authUserId)
}
