import { getJwtSecret } from 'nicefox-auth'

export const config = {
  port: parseInt(process.env.PORT || '3100', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // GraphDB (env is determined by NODE_ENV in the GraphDB implementation)
  graphdb: {
    url: process.env.GRAPHDB_URL || 'https://graphdb.nicefox.net',
    project: process.env.GRAPHDB_PROJECT || 'stock',
    apiKey: process.env.GRAPHDB_API_KEY || '',
  },

  // Auth (uses getJwtSecret which auto-detects localhost)
  jwtSecret: getJwtSecret(),

  // CORS
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
}
