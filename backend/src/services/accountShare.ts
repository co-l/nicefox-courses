import * as accountShareQueries from '../db/accountShareQueries.js'
import { createAccountShareService } from './accountShareService.js'

const accountShareService = createAccountShareService({
  repository: {
    listAllShares: accountShareQueries.listAllShares,
    createShare: accountShareQueries.createShare,
    updateShare: accountShareQueries.updateShare,
    getById: accountShareQueries.getShareById,
  },
})

export const requestShare = accountShareService.requestShare
export const cancelShareRequest = accountShareService.cancelShareRequest
export const respondToIncomingShare = accountShareService.respondToIncomingShare
export const getShareStatus = accountShareService.getShareStatus
export const stopSharing = accountShareService.stopSharing
