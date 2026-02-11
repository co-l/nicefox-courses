import type { AccountShare, AccountShareStatus } from '../types/index.js'

export type AccountShareRecord = AccountShare

export function normalizeShareEmail(value: string): string {
  return value.trim().toLowerCase()
}

const ACTIVE_STATUSES: ReadonlySet<AccountShareStatus> = new Set(['pending', 'accepted'])

export function findOwnerActiveShare(
  shares: readonly AccountShareRecord[],
  ownerUserId: string
): AccountShareRecord | null {
  const activeShares = shares
    .filter((share) => share.ownerUserId === ownerUserId && ACTIVE_STATUSES.has(share.status))
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))

  const accepted = activeShares.find((share) => share.status === 'accepted')
  return accepted ?? activeShares[0] ?? null
}

export function getIncomingPendingShares(
  shares: readonly AccountShareRecord[],
  actorEmail: string
): AccountShareRecord[] {
  const normalizedEmail = normalizeShareEmail(actorEmail)
  return shares
    .filter(
      (share) =>
        share.status === 'pending' && normalizeShareEmail(share.targetEmail) === normalizedEmail
    )
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
}

export function findAcceptedShareForTargetAuth(
  shares: readonly AccountShareRecord[],
  actorAuthUserId: string
): AccountShareRecord | null {
  const accepted = shares
    .filter(
      (share) =>
        share.status === 'accepted' && share.targetAuthUserId === actorAuthUserId
    )
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))

  return accepted[0] ?? null
}

export function resolveEffectiveUserId(params: {
  actorUserId: string
  actorAuthUserId: string
  acceptedShareForTarget: AccountShareRecord | null
}): string {
  const { actorUserId, actorAuthUserId, acceptedShareForTarget } = params

  if (!acceptedShareForTarget) return actorUserId

  if (
    acceptedShareForTarget.status === 'accepted' &&
    acceptedShareForTarget.targetAuthUserId === actorAuthUserId
  ) {
    return acceptedShareForTarget.ownerUserId
  }

  return actorUserId
}
