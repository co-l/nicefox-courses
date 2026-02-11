import type { AccountShare, AccountShareStatusView } from '../types/index.js'
import {
  findAcceptedShareForTargetAuth,
  findOwnerActiveShare,
  getIncomingPendingShares,
  normalizeShareEmail,
  resolveEffectiveUserId,
} from './accountShareDomain.js'

export interface AccountShareRepository {
  listAllShares: () => Promise<AccountShare[]>
  createShare: (input: {
    ownerUserId: string
    ownerAuthUserId: string
    ownerEmail: string
    targetEmail: string
  }) => Promise<AccountShare>
  updateShare: (
    id: string,
    updates: Partial<AccountShare>
  ) => Promise<AccountShare>
  getById: (id: string) => Promise<AccountShare | null>
}

export interface CreateShareRequestInput {
  ownerUserId: string
  ownerAuthUserId: string
  ownerEmail: string
  targetEmail: string
}

type ShareDecision = 'accept' | 'refuse'

export function createAccountShareService({ repository }: { repository: AccountShareRepository }) {
  const nowIso = (): string => new Date().toISOString()

  const getAll = async (): Promise<AccountShare[]> => repository.listAllShares()

  const requestShare = async (input: CreateShareRequestInput): Promise<AccountShare> => {
    const targetEmail = normalizeShareEmail(input.targetEmail)
    if (!targetEmail) {
      throw new Error('Target email is required')
    }

    const allShares = await getAll()
    const activeShare = findOwnerActiveShare(allShares, input.ownerUserId)
    if (activeShare) {
      throw new Error('An active share already exists for this account')
    }

    return repository.createShare({
      ownerUserId: input.ownerUserId,
      ownerAuthUserId: input.ownerAuthUserId,
      ownerEmail: normalizeShareEmail(input.ownerEmail),
      targetEmail,
    })
  }

  const cancelShareRequest = async ({ ownerUserId }: { ownerUserId: string }): Promise<AccountShare> => {
    const allShares = await getAll()
    const activeShare = findOwnerActiveShare(allShares, ownerUserId)

    if (!activeShare || activeShare.status !== 'pending') {
      throw new Error('No pending share request found')
    }

    return repository.updateShare(activeShare.id, {
      status: 'cancelled',
      updatedAt: nowIso(),
    })
  }

  const respondToIncomingShare = async (input: {
    shareId: string
    targetEmail: string
    targetAuthUserId: string
    targetUserId: string
    decision: ShareDecision
  }): Promise<AccountShare> => {
    const share = await repository.getById(input.shareId)
    if (!share || share.status !== 'pending') {
      throw new Error('Pending share request not found')
    }

    if (normalizeShareEmail(share.targetEmail) !== normalizeShareEmail(input.targetEmail)) {
      throw new Error('Share request does not target this user')
    }

    const updatedAt = nowIso()
    if (input.decision === 'refuse') {
      return repository.updateShare(input.shareId, {
        status: 'refused',
        updatedAt,
        respondedAt: updatedAt,
      })
    }

    return repository.updateShare(input.shareId, {
      status: 'accepted',
      targetAuthUserId: input.targetAuthUserId,
      targetUserId: input.targetUserId,
      updatedAt,
      respondedAt: updatedAt,
    })
  }

  const getShareStatus = async (input: {
    actorUserId: string
    actorAuthUserId: string
    actorEmail: string
  }): Promise<AccountShareStatusView> => {
    const allShares = await getAll()
    const ownerActive = findOwnerActiveShare(allShares, input.actorUserId)
    const acceptedForTarget = findAcceptedShareForTargetAuth(allShares, input.actorAuthUserId)
    const incomingRequests = getIncomingPendingShares(allShares, input.actorEmail)

    if (ownerActive) {
      return {
        role: 'owner',
        effectiveOwnerUserId: input.actorUserId,
        partnerEmail:
          ownerActive.status === 'accepted'
            ? normalizeShareEmail(ownerActive.targetEmail)
            : normalizeShareEmail(ownerActive.targetEmail),
        outgoingRequest: ownerActive,
        incomingRequests,
      }
    }

    if (acceptedForTarget) {
      return {
        role: 'target',
        effectiveOwnerUserId: resolveEffectiveUserId({
          actorUserId: input.actorUserId,
          actorAuthUserId: input.actorAuthUserId,
          acceptedShareForTarget: acceptedForTarget,
        }),
        partnerEmail: normalizeShareEmail(acceptedForTarget.ownerEmail),
        outgoingRequest: acceptedForTarget,
        incomingRequests,
      }
    }

    return {
      role: 'none',
      effectiveOwnerUserId: input.actorUserId,
      partnerEmail: null,
      outgoingRequest: null,
      incomingRequests,
    }
  }

  const stopSharing = async (input: {
    actorUserId: string
    actorAuthUserId: string
  }): Promise<AccountShare> => {
    const allShares = await getAll()
    const acceptedShare = allShares
      .filter((share) => share.status === 'accepted')
      .find(
        (share) =>
          share.ownerUserId === input.actorUserId ||
          share.targetAuthUserId === input.actorAuthUserId
      )

    if (!acceptedShare) {
      throw new Error('No active accepted share found')
    }

    const updatedAt = nowIso()
    return repository.updateShare(acceptedShare.id, {
      status: 'stopped',
      updatedAt,
      stoppedAt: updatedAt,
    })
  }

  return {
    requestShare,
    cancelShareRequest,
    respondToIncomingShare,
    getShareStatus,
    stopSharing,
  }
}
