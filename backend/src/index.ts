import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { authMiddleware } from 'nicefox-auth'
import { config } from './config.js'
import { stockUserMiddleware } from './services/user.js'
import { initDatabase, testConnection } from './db/graphdb.js'
import itemsRouter from './routes/items.js'
import accountShareRouter from './routes/accountShare.js'
import { securityHeadersMiddleware } from './securityHeaders.js'

const app = express()

// Middleware
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}))
app.disable('x-powered-by')
app.use(securityHeadersMiddleware())
app.use(express.json())
app.use(cookieParser())

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Auth info endpoint (for frontend) - no stockUser needed
app.get('/api/auth/me', authMiddleware({ jwtSecret: config.jwtSecret }), (req, res) => {
  res.json(req.authUser)
})

// Protected API routes with stockUser
app.use('/api/items', authMiddleware({ jwtSecret: config.jwtSecret }), stockUserMiddleware(), itemsRouter)
app.use('/api/account-share', authMiddleware({ jwtSecret: config.jwtSecret }), stockUserMiddleware(), accountShareRouter)

// Start server
async function start() {
  // Initialize LeanGraph
  await initDatabase()
  
  // Test LeanGraph connection
  const connected = await testConnection()
  if (!connected) {
    console.error('Failed to connect to LeanGraph. Please check your configuration.')
    process.exit(1)
  }
  console.log('Connected to LeanGraph')

  app.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`)
    console.log(`Environment: ${config.nodeEnv}`)
  })
}

start()
