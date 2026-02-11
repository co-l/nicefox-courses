import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createAccountShareService,
  type AccountShareRepository,
  type CreateShareRequestInput,
} from './accountShareService.js'
import type { AccountShareStatus } from '../types/index.js'

type ShareRecord = {
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

function createInMemoryRepo(initialShares: ShareRecord[] = []): AccountShareRepository {
  const shares = [...initialShares]

  const clone = (share: ShareRecord): ShareRecord => ({ ...share })

  return {
    async listAllShares() {
      return shares.map(clone)
    },
    async createShare(input) {
      const now = '2026-01-01T12:00:00.000Z'
      const share: ShareRecord = {
        id: `share-${shares.length + 1}`,
        ownerUserId: input.ownerUserId,
        ownerAuthUserId: input.ownerAuthUserId,
        ownerEmail: input.ownerEmail,
        targetEmail: input.targetEmail,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      }
      shares.push(share)
      return clone(share)
    },
    async updateShare(id, updates) {
      const share = shares.find((item) => item.id === id)
      if (!share) {
        throw new Error('Share not found')
      }
      Object.assign(share, updates)
      return clone(share)
    },
    async getById(id) {
      const share = shares.find((item) => item.id === id)
      return share ? clone(share) : null
    },
  }
}

const makeRequest = (overrides: Partial<CreateShareRequestInput> = {}): CreateShareRequestInput => ({
  ownerUserId: 'owner-1',
  ownerAuthUserId: 'auth-owner-1',
  ownerEmail: 'owner@example.test',
  targetEmail: 'target@example.test',
  ...overrides,
})

test('requestShare stores pending request even when target account does not exist', async () => {
  const service = createAccountShareService({ repository: createInMemoryRepo() })

  const created = await service.requestShare(makeRequest())

  assert.equal(created.status, 'pending')
  assert.equal(created.targetEmail, 'target@example.test')
})

test('requestShare blocks owner from creating a second active request', async () => {
  const existing: ShareRecord = {
    id: 'share-1',
    ownerUserId: 'owner-1',
    ownerAuthUserId: 'auth-owner-1',
    ownerEmail: 'owner@example.test',
    targetEmail: 'first@example.com',
    status: 'pending',
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
  }
  const service = createAccountShareService({ repository: createInMemoryRepo([existing]) })

  await assert.rejects(
    () => service.requestShare(makeRequest({ targetEmail: 'second@example.com' })),
    (error: unknown) =>
      error instanceof Error && error.message === 'An active share already exists for this account'
  )
})

test('cancelShareRequest cancels only owner pending request', async () => {
  const existing: ShareRecord = {
    id: 'share-1',
    ownerUserId: 'owner-1',
    ownerAuthUserId: 'auth-owner-1',
    ownerEmail: 'owner@example.test',
    targetEmail: 'first@example.com',
    status: 'pending',
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
  }
  const service = createAccountShareService({ repository: createInMemoryRepo([existing]) })

  const cancelled = await service.cancelShareRequest({
    ownerUserId: 'owner-1',
  })

  assert.equal(cancelled.status, 'cancelled')
})

test('respondToIncomingShare accepts pending request for matching target email', async () => {
  const existing: ShareRecord = {
    id: 'share-1',
    ownerUserId: 'owner-1',
    ownerAuthUserId: 'auth-owner-1',
    ownerEmail: 'owner@example.test',
    targetEmail: 'target@example.test',
    status: 'pending',
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
  }
  const service = createAccountShareService({ repository: createInMemoryRepo([existing]) })

  const accepted = await service.respondToIncomingShare({
    shareId: 'share-1',
    targetEmail: 'target@example.test',
    targetAuthUserId: 'auth-target-1',
    targetUserId: 'target-1',
    decision: 'accept',
  })

  assert.equal(accepted.status, 'accepted')
  assert.equal(accepted.targetAuthUserId, 'auth-target-1')
  assert.equal(accepted.targetUserId, 'target-1')
})

test('getShareStatus resolves linked target to owner account', async () => {
  const accepted: ShareRecord = {
    id: 'share-1',
    ownerUserId: 'owner-1',
    ownerAuthUserId: 'auth-owner-1',
    ownerEmail: 'owner@example.test',
    targetEmail: 'target@example.test',
    status: 'accepted',
    targetAuthUserId: 'auth-target-1',
    targetUserId: 'target-1',
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
  }

  const service = createAccountShareService({ repository: createInMemoryRepo([accepted]) })

  const status = await service.getShareStatus({
    actorUserId: 'target-1',
    actorAuthUserId: 'auth-target-1',
    actorEmail: 'target@example.test',
  })

  assert.equal(status.role, 'target')
  assert.equal(status.effectiveOwnerUserId, 'owner-1')
  assert.equal(status.partnerEmail, 'owner@example.test')
})

test('stopSharing allows target participant to stop accepted share', async () => {
  const accepted: ShareRecord = {
    id: 'share-1',
    ownerUserId: 'owner-1',
    ownerAuthUserId: 'auth-owner-1',
    ownerEmail: 'owner@example.test',
    targetEmail: 'target@example.test',
    status: 'accepted',
    targetAuthUserId: 'auth-target-1',
    targetUserId: 'target-1',
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
  }

  const service = createAccountShareService({ repository: createInMemoryRepo([accepted]) })

  const stopped = await service.stopSharing({
    actorUserId: 'target-1',
    actorAuthUserId: 'auth-target-1',
  })

  assert.equal(stopped.status, 'stopped')
})
