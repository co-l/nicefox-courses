import { getDb } from './graphdb.js'
import { v4 as uuidv4 } from 'uuid'
import type { StockUser } from '../types/index.js'

export const FIND_USER_BY_AUTH_ID_QUERY = `
  MATCH (u:Stock_User {authUserId: $authUserId})
  RETURN u
  ORDER BY u.createdAt DESC
  LIMIT 1
`

export async function findUserByAuthId(authUserId: string): Promise<StockUser | null> {
  const db = getDb()
  const result = await db.query<{ u: StockUser }>(FIND_USER_BY_AUTH_ID_QUERY, { authUserId })
  return result[0]?.u || null
}

export async function createUser(authUserId: string, email?: string): Promise<StockUser> {
  const db = getDb()
  const id = uuidv4()
  const now = new Date().toISOString()

  if (email !== undefined) {
    const resultWithEmail = await db.query<{ u: StockUser }>(
      `CREATE (u:Stock_User {id: $id, authUserId: $authUserId, email: $email, createdAt: $now}) RETURN u`,
      { id, authUserId, email, now }
    )
    return resultWithEmail[0].u
  }

  const result = await db.query<{ u: StockUser }>(
    `CREATE (u:Stock_User {id: $id, authUserId: $authUserId, createdAt: $now}) RETURN u`,
    { id, authUserId, now }
  )
  return result[0].u
}

export async function updateUserEmail(id: string, email: string): Promise<StockUser | null> {
  const db = getDb()
  const result = await db.query<{ u: StockUser }>(
    'MATCH (u:Stock_User {id: $id}) SET u.email = $email RETURN u',
    { id, email }
  )
  return result[0]?.u ?? null
}

export async function getOrCreateUser(authUserId: string, email?: string): Promise<StockUser> {
  const existing = await findUserByAuthId(authUserId)
  if (!existing) {
    return createUser(authUserId, email)
  }

  if (email !== undefined && existing.email !== email) {
    const updated = await updateUserEmail(existing.id, email)
    return updated ?? { ...existing, email }
  }

  return existing
}
