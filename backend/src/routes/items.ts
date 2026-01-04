import { Router, Request, Response } from 'express'
import * as itemService from '../services/item.js'
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

// POST /api/items/temporary - Create temporary item for shopping list
router.post('/temporary', async (req: Request, res: Response) => {
  try {
    const { name, quantity = 1, unit = 'unité(s)' } = req.body as { name: string; quantity?: number; unit?: string }
    
    if (!name || typeof name !== 'string' || name.trim() === '') {
      res.status(400).json({ error: 'name is required' })
      return
    }

    // Create temporary item with currentQuantity = 0 so it appears in shopping list
    const item = await itemService.createItem(req.stockUser!.id, {
      name: name.trim(),
      targetQuantity: quantity,
      currentQuantity: 0,
      unit,
      isTemporary: true,
    })

    res.status(201).json(item)
  } catch (error) {
    console.error('Failed to create temporary item:', error)
    res.status(500).json({ error: 'Failed to create temporary item' })
  }
})

// POST /api/items/:id/mark-purchased - Mark item as purchased (set currentQuantity = targetQuantity)
router.post('/:id/mark-purchased', async (req: Request, res: Response) => {
  try {
    const { purchased } = req.body as { purchased: boolean }
    const item = await itemService.getItemById(req.params.id, req.stockUser!.id)
    if (!item) {
      res.status(404).json({ error: 'Item not found' })
      return
    }
    
    // If marking as purchased, set current = target; if unmarking, set current = 0
    const newCurrentQuantity = purchased ? item.targetQuantity : 0
    const updated = await itemService.updateItem(req.params.id, req.stockUser!.id, {
      currentQuantity: newCurrentQuantity,
    })
    res.json(updated)
  } catch (error) {
    console.error('Failed to mark item as purchased:', error)
    res.status(500).json({ error: 'Failed to mark item as purchased' })
  }
})

// DELETE /api/items/temporary - Delete all temporary items
router.delete('/temporary', async (req: Request, res: Response) => {
  try {
    await itemService.deleteTemporaryItems(req.stockUser!.id)
    res.status(204).send()
  } catch (error) {
    console.error('Failed to delete temporary items:', error)
    res.status(500).json({ error: 'Failed to delete temporary items' })
  }
})

export default router
