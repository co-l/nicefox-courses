import { db } from './graphdb.js'
import { v4 as uuidv4 } from 'uuid'
import type { StockUser } from '../types/index.js'

export async function findUserByAuthId(authUserId: string): Promise<StockUser | null> {
  const result = await db.query<{ u: StockUser }>(
    `MATCH (u:Stock_User {authUserId: $authUserId}) RETURN u`,
    { authUserId }
  )
  return result[0]?.u || null
}

export async function createUser(authUserId: string): Promise<StockUser> {
  const id = uuidv4()
  const result = await db.query<{ u: StockUser }>(
    `CREATE (u:Stock_User {
      id: $id,
      authUserId: $authUserId,
      createdAt: datetime()
    }) RETURN u`,
    { id, authUserId }
  )
  return result[0].u
}

export async function getOrCreateUser(authUserId: string): Promise<StockUser> {
  const existing = await findUserByAuthId(authUserId)
  if (existing) return existing
  return createUser(authUserId)
}
