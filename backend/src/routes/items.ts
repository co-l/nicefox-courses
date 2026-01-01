import { Router, Request, Response } from 'express'
import * as itemService from '../services/item.js'
import * as sessionService from '../services/session.js'
import type { CreateItemRequest, UpdateItemRequest, ReorderItemsRequest } from '../types/index.js'

const router = Router()

// GET /api/items - List all items
router.get('/', async (req: Request, res: Response) => {
  try {
    const items = await itemService.getAllItems(req.stockUser!.id)
    res.json(items)
  } catch (error) {
    console.error('Failed to get items:', error)
    res.status(500).json({ error: 'Failed to get items' })
  }
})

// GET /api/items/:id - Get item by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const item = await itemService.getItemById(req.params.id, req.stockUser!.id)
    if (!item) {
      res.status(404).json({ error: 'Item not found' })
      return
    }
    res.json(item)
  } catch (error) {
    console.error('Failed to get item:', error)
    res.status(500).json({ error: 'Failed to get item' })
  }
})

// POST /api/items - Create new item
router.post('/', async (req: Request, res: Response) => {
  try {
    const data: CreateItemRequest = req.body
    
    // Validation
    if (!data.name || !data.unit) {
      res.status(400).json({ error: 'Missing required fields: name, unit' })
      return
    }
    if (typeof data.targetQuantity !== 'number' || data.targetQuantity < 0) {
      res.status(400).json({ error: 'targetQuantity must be a non-negative number' })
      return
    }

    const item = await itemService.createItem(req.stockUser!.id, data)
    res.status(201).json(item)
  } catch (error) {
    console.error('Failed to create item:', error)
    res.status(500).json({ error: 'Failed to create item' })
  }
})

// PUT /api/items/:id - Update item
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const data: UpdateItemRequest = req.body
    const item = await itemService.updateItem(req.params.id, req.stockUser!.id, data)
    if (!item) {
      res.status(404).json({ error: 'Item not found' })
      return
    }
    res.json(item)
  } catch (error) {
    console.error('Failed to update item:', error)
    res.status(500).json({ error: 'Failed to update item' })
  }
})

// DELETE /api/items/:id - Delete item
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await itemService.deleteItem(req.params.id, req.stockUser!.id)
    if (!deleted) {
      res.status(404).json({ error: 'Item not found' })
      return
    }
    res.status(204).send()
  } catch (error) {
    console.error('Failed to delete item:', error)
    res.status(500).json({ error: 'Failed to delete item' })
  }
})

// POST /api/items/reorder - Reorder items
router.post('/reorder', async (req: Request, res: Response) => {
  try {
    const data: ReorderItemsRequest = req.body
    if (!Array.isArray(data.items)) {
      res.status(400).json({ error: 'items must be an array' })
      return
    }
    await itemService.reorderItems(req.stockUser!.id, data.items)
    res.status(200).json({ success: true })
  } catch (error) {
    console.error('Failed to reorder items:', error)
    res.status(500).json({ error: 'Failed to reorder items' })
  }
})

// POST /api/items/temporary - Create temporary item and add to current session
router.post('/temporary', async (req: Request, res: Response) => {
  try {
    const { name, quantity = 1 } = req.body as { name: string; quantity?: number }
    
    if (!name || typeof name !== 'string' || name.trim() === '') {
      res.status(400).json({ error: 'name is required' })
      return
    }

    // Create temporary item
    const item = await itemService.createItem(req.stockUser!.id, {
      name: name.trim(),
      targetQuantity: quantity,
      unit: 'pcs',
      isTemporary: true,
    })

    // Add to current session if one exists
    await sessionService.addSessionItemForItem(req.stockUser!.id, item.id, quantity)

    res.status(201).json(item)
  } catch (error) {
    console.error('Failed to create temporary item:', error)
    res.status(500).json({ error: 'Failed to create temporary item' })
  }
})

export default router
