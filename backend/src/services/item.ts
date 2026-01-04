import * as itemQueries from '../db/itemQueries.js'
import type { StockItem, CreateItemRequest, UpdateItemRequest } from '../types/index.js'

export async function getAllItems(userId: string): Promise<StockItem[]> {
  return itemQueries.findAllItems(userId)
}

export async function getItemById(id: string, userId: string): Promise<StockItem | null> {
  return itemQueries.findItemById(id, userId)
}

export async function createItem(userId: string, data: CreateItemRequest): Promise<StockItem> {
  return itemQueries.createItem(userId, data)
}

export async function updateItem(
  id: string,
  userId: string,
  data: UpdateItemRequest
): Promise<StockItem | null> {
  return itemQueries.updateItem(id, userId, data)
}

export async function deleteItem(id: string, userId: string): Promise<boolean> {
  return itemQueries.deleteItem(id, userId)
}

export async function deleteTemporaryItems(userId: string): Promise<void> {
  return itemQueries.deleteTemporaryItems(userId)
}
