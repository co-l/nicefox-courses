import { Request, Response, NextFunction, RequestHandler } from 'express'
import jwt from 'jsonwebtoken'
import type { AuthUser, TokenPayload } from '../types/index.js'

const COOKIE_NAME = 'auth_token'

export interface AuthMiddlewareOptions {
  jwtSecret: string
  authServiceUrl?: string
}

function verifyToken(token: string, secret: string): TokenPayload | null {
  try {
    return jwt.verify(token, secret) as TokenPayload
  } catch {
    return null
  }
}

/**
 * Express middleware to verify JWT from auth_token cookie or Authorization header.
 * Attaches authUser and tokenPayload to request.
 */
export function authMiddleware(options: AuthMiddlewareOptions): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Try cookie first, then Authorization header (for dev mode)
    let token = req.cookies?.[COOKIE_NAME]

    if (!token) {
      const authHeader = req.headers.authorization
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7)
      }
    }

    if (!token) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    const payload = verifyToken(token, options.jwtSecret)
    if (!payload) {
      res.status(401).json({ error: 'Invalid or expired token' })
      return
    }

    // Attach user info to request
    req.authUser = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
    }
    req.tokenPayload = payload

    next()
  }
}

/**
 * Helper to get login URL for redirecting unauthenticated users.
 */
export function getLoginUrl(authServiceUrl: string, redirectUrl?: string): string {
  const base = `${authServiceUrl}/login`
  if (redirectUrl) {
    return `${base}?redirect=${encodeURIComponent(redirectUrl)}`
  }
  return base
}
