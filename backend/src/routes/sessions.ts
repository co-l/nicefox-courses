import { Router, Request, Response } from 'express'
import * as sessionService from '../services/session.js'
import type { UpdateSessionItemRequest, ReorderSessionItemsRequest, StockSession } from '../types/index.js'

const router = Router()

// GET /api/sessions/current - Get current active session
router.get('/current', async (req: Request, res: Response) => {
  try {
    const session = await sessionService.getCurrentSession(req.stockUser!.id)
    if (!session) {
      res.status(404).json({ error: 'No active session' })
      return
    }
    res.json(session)
  } catch (error) {
    console.error('Failed to get current session:', error)
    res.status(500).json({ error: 'Failed to get current session' })
  }
})

// GET /api/sessions/:id - Get session by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const session = await sessionService.getSessionById(req.params.id, req.stockUser!.id)
    if (!session) {
      res.status(404).json({ error: 'Session not found' })
      return
    }
    res.json(session)
  } catch (error) {
    console.error('Failed to get session:', error)
    res.status(500).json({ error: 'Failed to get session' })
  }
})

// POST /api/sessions - Create new session
router.post('/', async (req: Request, res: Response) => {
  try {
    const session = await sessionService.createSession(req.stockUser!.id)
    res.status(201).json(session)
  } catch (error) {
    if (error instanceof Error && error.message === 'An active session already exists') {
      res.status(409).json({ error: error.message })
      return
    }
    console.error('Failed to create session:', error)
    res.status(500).json({ error: 'Failed to create session' })
  }
})

// PATCH /api/sessions/:id/status - Update session status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body as { status: StockSession['status'] }
    
    if (!['pre-shopping', 'shopping', 'completed'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' })
      return
    }

    const session = await sessionService.updateSessionStatus(req.params.id, req.stockUser!.id, status)
    if (!session) {
      res.status(404).json({ error: 'Session not found' })
      return
    }
    res.json(session)
  } catch (error) {
    console.error('Failed to update session status:', error)
    res.status(500).json({ error: 'Failed to update session status' })
  }
})

// PATCH /api/sessions/:id/items/:itemId - Update session item
router.patch('/:id/items/:itemId', async (req: Request, res: Response) => {
  try {
    const data: UpdateSessionItemRequest = req.body
    const sessionItem = await sessionService.updateSessionItem(
      req.params.id,
      req.params.itemId,
      req.stockUser!.id,
      data
    )
    if (!sessionItem) {
      res.status(404).json({ error: 'Session or item not found' })
      return
    }
    res.json(sessionItem)
  } catch (error) {
    console.error('Failed to update session item:', error)
    res.status(500).json({ error: 'Failed to update session item' })
  }
})

// POST /api/sessions/:id/complete - Complete session
router.post('/:id/complete', async (req: Request, res: Response) => {
  try {
    const session = await sessionService.completeSession(req.params.id, req.stockUser!.id)
    if (!session) {
      res.status(404).json({ error: 'Session not found' })
      return
    }
    res.json(session)
  } catch (error) {
    console.error('Failed to complete session:', error)
    res.status(500).json({ error: 'Failed to complete session' })
  }
})

// POST /api/sessions/:id/reorder - Reorder session items
router.post('/:id/reorder', async (req: Request, res: Response) => {
  try {
    const { items } = req.body as ReorderSessionItemsRequest
    
    if (!Array.isArray(items)) {
      res.status(400).json({ error: 'items must be an array' })
      return
    }

    const success = await sessionService.reorderSessionItems(
      req.params.id,
      req.stockUser!.id,
      items
    )
    
    if (!success) {
      res.status(404).json({ error: 'Session not found' })
      return
    }
    
    res.json({ success: true })
  } catch (error) {
    console.error('Failed to reorder session items:', error)
    res.status(500).json({ error: 'Failed to reorder session items' })
  }
})

export default router
