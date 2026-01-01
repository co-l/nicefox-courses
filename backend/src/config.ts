export const config = {
  port: parseInt(process.env.PORT || '3100', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // GraphDB
  graphdb: {
    url: process.env.GRAPHDB_URL || 'https://graphdb.nicefox.net',
    project: process.env.GRAPHDB_PROJECT || 'stock',
    apiKey: process.env.GRAPHDB_API_KEY || '',
    env: (process.env.GRAPHDB_ENV || 'production') as 'production' | 'test',
  },

  // Auth
  jwtSecret: process.env.JWT_SECRET || '',
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'https://auth.nicefox.net',

  // CORS
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
}
