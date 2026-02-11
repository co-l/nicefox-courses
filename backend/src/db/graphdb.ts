import { LeanGraph, type LeanGraphClient } from 'leangraph'
import { config } from '../config.js'

let db: LeanGraphClient | null = null

export async function initDatabase(): Promise<LeanGraphClient> {
  if (db) return db

  db = await LeanGraph({
    mode: config.leangraph.mode,
    url: config.leangraph.url,
    project: config.leangraph.project,
    apiKey: config.leangraph.apiKey,
  })

  return db
}

export function getDb(): LeanGraphClient {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return db
}

export async function testConnection(): Promise<boolean> {
  try {
    const database = getDb()
    await database.query('RETURN 1')
    return true
  } catch (error) {
    console.error('LeanGraph connection failed:', error)
    return false
  }
}
