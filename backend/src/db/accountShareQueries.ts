import { v4 as uuidv4 } from 'uuid'
import { getDb } from './graphdb.js'
import type { AccountShare } from '../types/index.js'

export async function listAllShares(): Promise<AccountShare[]> {
  const db = getDb()
  const result = await db.query<{ share: AccountShare }>('MATCH (share:Stock_AccountShare) RETURN share')
  return result.map((entry) => entry.share)
}

export async function getShareById(id: string): Promise<AccountShare | null> {
  const db = getDb()
  const result = await db.query<{ share: AccountShare }>(
    'MATCH (share:Stock_AccountShare {id: $id}) RETURN share',
    { id }
  )
  return result[0]?.share ?? null
}

export async function createShare(input: {
  ownerUserId: string
  ownerAuthUserId: string
  ownerEmail: string
  targetEmail: string
}): Promise<AccountShare> {
  const db = getDb()
  const now = new Date().toISOString()
  const id = uuidv4()
  const result = await db.query<{ share: AccountShare }>(
    `CREATE (share:Stock_AccountShare {
      id: $id,
      ownerUserId: $ownerUserId,
      ownerAuthUserId: $ownerAuthUserId,
      ownerEmail: $ownerEmail,
      targetEmail: $targetEmail,
      status: 'pending',
      createdAt: $now,
      updatedAt: $now
    })
    RETURN share`,
    {
      id,
      ownerUserId: input.ownerUserId,
      ownerAuthUserId: input.ownerAuthUserId,
      ownerEmail: input.ownerEmail,
      targetEmail: input.targetEmail,
      now,
    }
  )
  return result[0].share
}

export async function updateShare(
  id: string,
  updates: Partial<AccountShare>
): Promise<AccountShare> {
  const db = getDb()
  const setClauses: string[] = []
  const params: Record<string, unknown> = { id }

  if (updates.ownerUserId !== undefined) {
    setClauses.push('share.ownerUserId = $ownerUserId')
    params.ownerUserId = updates.ownerUserId
  }
  if (updates.ownerAuthUserId !== undefined) {
    setClauses.push('share.ownerAuthUserId = $ownerAuthUserId')
    params.ownerAuthUserId = updates.ownerAuthUserId
  }
  if (updates.ownerEmail !== undefined) {
    setClauses.push('share.ownerEmail = $ownerEmail')
    params.ownerEmail = updates.ownerEmail
  }
  if (updates.targetEmail !== undefined) {
    setClauses.push('share.targetEmail = $targetEmail')
    params.targetEmail = updates.targetEmail
  }
  if (updates.status !== undefined) {
    setClauses.push('share.status = $status')
    params.status = updates.status
  }
  if (updates.targetAuthUserId !== undefined) {
    setClauses.push('share.targetAuthUserId = $targetAuthUserId')
    params.targetAuthUserId = updates.targetAuthUserId
  }
  if (updates.targetUserId !== undefined) {
    setClauses.push('share.targetUserId = $targetUserId')
    params.targetUserId = updates.targetUserId
  }
  if (updates.updatedAt !== undefined) {
    setClauses.push('share.updatedAt = $updatedAt')
    params.updatedAt = updates.updatedAt
  }
  if (updates.respondedAt !== undefined) {
    setClauses.push('share.respondedAt = $respondedAt')
    params.respondedAt = updates.respondedAt
  }
  if (updates.stoppedAt !== undefined) {
    setClauses.push('share.stoppedAt = $stoppedAt')
    params.stoppedAt = updates.stoppedAt
  }

  if (setClauses.length === 0) {
    const existing = await getShareById(id)
    if (!existing) {
      throw new Error('Share not found')
    }
    return existing
  }

  const result = await db.query<{ share: AccountShare }>(
    `MATCH (share:Stock_AccountShare {id: $id})
     SET ${setClauses.join(', ')}
     RETURN share`,
    params
  )

  if (!result[0]?.share) {
    throw new Error('Share not found')
  }

  return result[0].share
}
