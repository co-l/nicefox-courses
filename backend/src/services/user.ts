import { Request, Response, NextFunction, RequestHandler } from 'express'
import { getOrCreateUser } from '../db/userQueries.js'

/**
 * Middleware to get or create Stock_User from authenticated AuthUser.
 * Must be used after authMiddleware.
 */
export function stockUserMiddleware(): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.authUser) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    try {
      const stockUser = await getOrCreateUser(req.authUser.id)
      req.stockUser = stockUser
      next()
    } catch (error) {
      console.error('Failed to get/create stock user:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
}
