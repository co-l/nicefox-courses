import { GraphDB, GraphDBClient } from 'nicefox-graphdb'
import { config } from '../config.js'

let db: GraphDBClient | null = null

export async function initDatabase(): Promise<GraphDBClient> {
  if (db) return db

  db = await GraphDB({
    url: config.graphdb.url,
    project: config.graphdb.project,
    apiKey: config.graphdb.apiKey,
  })

  return db
}

export function getDb(): GraphDBClient {
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
    console.error('GraphDB connection failed:', error)
    return false
  }
}
