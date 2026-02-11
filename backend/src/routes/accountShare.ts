import { Router, type Request, type Response } from 'express'
import {
  cancelShareRequest,
  getShareStatus,
  requestShare,
  respondToIncomingShare,
  stopSharing,
} from '../services/accountShare.js'

const router = Router()

router.get('/status', async (req: Request, res: Response) => {
  try {
    const actorStockUser = req.actorStockUser
    if (!actorStockUser || !req.authUser) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    const status = await getShareStatus({
      actorUserId: actorStockUser.id,
      actorAuthUserId: req.authUser.id,
      actorEmail: req.authUser.email ?? '',
    })

    res.json(status)
  } catch (error) {
    console.error('Failed to fetch account share status:', error)
    res.status(500).json({ error: 'Failed to fetch account share status' })
  }
})

router.post('/request', async (req: Request, res: Response) => {
  try {
    const actorStockUser = req.actorStockUser
    if (!actorStockUser || !req.authUser) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    const { targetEmail } = req.body as { targetEmail?: string }
    if (typeof targetEmail !== 'string') {
      res.status(400).json({ error: 'targetEmail is required' })
      return
    }

    const share = await requestShare({
      ownerUserId: actorStockUser.id,
      ownerAuthUserId: req.authUser.id,
      ownerEmail: req.authUser.email ?? '',
      targetEmail,
    })
    res.status(201).json(share)
  } catch (error) {
    console.error('Failed to create share request:', error)
    if (error instanceof Error) {
      res.status(400).json({ error: error.message })
      return
    }
    res.status(500).json({ error: 'Failed to create share request' })
  }
})

router.post('/request/cancel', async (req: Request, res: Response) => {
  try {
    const actorStockUser = req.actorStockUser
    if (!actorStockUser) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    const share = await cancelShareRequest({ ownerUserId: actorStockUser.id })
    res.json(share)
  } catch (error) {
    console.error('Failed to cancel share request:', error)
    if (error instanceof Error) {
      res.status(400).json({ error: error.message })
      return
    }
    res.status(500).json({ error: 'Failed to cancel share request' })
  }
})

router.post('/respond', async (req: Request, res: Response) => {
  try {
    const actorStockUser = req.actorStockUser
    if (!actorStockUser || !req.authUser) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    const { requestId, decision } = req.body as {
      requestId?: string
      decision?: 'accept' | 'refuse'
    }

    if (typeof requestId !== 'string') {
      res.status(400).json({ error: 'requestId is required' })
      return
    }
    if (decision !== 'accept' && decision !== 'refuse') {
      res.status(400).json({ error: 'decision must be accept or refuse' })
      return
    }

    const share = await respondToIncomingShare({
      shareId: requestId,
      targetEmail: req.authUser.email ?? '',
      targetAuthUserId: req.authUser.id,
      targetUserId: actorStockUser.id,
      decision,
    })

    res.json(share)
  } catch (error) {
    console.error('Failed to respond to share request:', error)
    if (error instanceof Error) {
      res.status(400).json({ error: error.message })
      return
    }
    res.status(500).json({ error: 'Failed to respond to share request' })
  }
})

router.post('/stop', async (req: Request, res: Response) => {
  try {
    const actorStockUser = req.actorStockUser
    if (!actorStockUser || !req.authUser) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    const share = await stopSharing({
      actorUserId: actorStockUser.id,
      actorAuthUserId: req.authUser.id,
    })

    res.json(share)
  } catch (error) {
    console.error('Failed to stop account sharing:', error)
    if (error instanceof Error) {
      res.status(400).json({ error: error.message })
      return
    }
    res.status(500).json({ error: 'Failed to stop account sharing' })
  }
})

export default router
