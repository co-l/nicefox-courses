import { NiceFoxGraphDB } from 'nicefox-graphdb/packages/client/src/index.js'
import { config } from '../config.js'

export const db = new NiceFoxGraphDB({
  url: config.graphdb.url,
  project: config.graphdb.project,
  env: config.graphdb.env,
  apiKey: config.graphdb.apiKey,
})

export async function testConnection(): Promise<boolean> {
  try {
    await db.query('RETURN 1')
    return true
  } catch (error) {
    console.error('GraphDB connection failed:', error)
    return false
  }
}
