import test from 'node:test'
import assert from 'node:assert/strict'
import {
  findOwnerActiveShare,
  getIncomingPendingShares,
  normalizeShareEmail,
  resolveEffectiveUserId,
  type AccountShareRecord,
} from './accountShareDomain.js'

const baseShare = (overrides: Partial<AccountShareRecord>): AccountShareRecord => ({
  id: 'share-1',
  ownerUserId: 'owner-1',
  ownerAuthUserId: 'auth-owner-1',
  ownerEmail: 'owner@example.com',
  targetEmail: 'target@example.com',
  status: 'pending',
  createdAt: '2026-01-01T10:00:00.000Z',
  updatedAt: '2026-01-01T10:00:00.000Z',
  ...overrides,
})

test('normalizeShareEmail trims and lowercases without validating', () => {
  assert.equal(
    normalizeShareEmail('  TARGET+ALIAS@EXAMPLE.TEST  '),
    'target+alias@example.test'
  )
  assert.equal(normalizeShareEmail('not-an-email'), 'not-an-email')
  assert.equal(normalizeShareEmail('   '), '')
})

test('findOwnerActiveShare returns accepted over older pending shares', () => {
  const shares = [
    baseShare({ id: 'share-1', status: 'pending', updatedAt: '2026-01-01T10:00:00.000Z' }),
    baseShare({ id: 'share-2', status: 'accepted', updatedAt: '2026-01-02T10:00:00.000Z' }),
    baseShare({ id: 'share-3', status: 'cancelled', updatedAt: '2026-01-03T10:00:00.000Z' }),
  ]

  const active = findOwnerActiveShare(shares, 'owner-1')

  assert.equal(active?.id, 'share-2')
})

test('getIncomingPendingShares matches by normalized target email', () => {
  const shares = [
    baseShare({ id: 'share-1', targetEmail: 'target@example.test', status: 'pending' }),
    baseShare({ id: 'share-2', targetEmail: 'other@yahoo.fr', status: 'pending' }),
    baseShare({ id: 'share-3', targetEmail: 'target@example.test', status: 'accepted' }),
  ]

  const incoming = getIncomingPendingShares(shares, '  TARGET@EXAMPLE.TEST ')

  assert.deepEqual(incoming.map((share) => share.id), ['share-1'])
})

test('resolveEffectiveUserId returns owner user for accepted target mapping', () => {
  const acceptedShare = baseShare({
    status: 'accepted',
    ownerUserId: 'owner-main',
    targetAuthUserId: 'auth-target-1',
  })

  const effective = resolveEffectiveUserId({
    actorUserId: 'target-local-user',
    actorAuthUserId: 'auth-target-1',
    acceptedShareForTarget: acceptedShare,
  })

  assert.equal(effective, 'owner-main')
})

test('resolveEffectiveUserId keeps actor user when mapping is missing', () => {
  const effective = resolveEffectiveUserId({
    actorUserId: 'owner-1',
    actorAuthUserId: 'auth-owner-1',
    acceptedShareForTarget: null,
  })

  assert.equal(effective, 'owner-1')
})
