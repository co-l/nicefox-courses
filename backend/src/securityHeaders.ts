import type { RequestHandler } from 'express'

export const buildSecurityHeaders = (): Readonly<Record<string, string>> => Object.freeze({
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
})

export const securityHeadersMiddleware = (): RequestHandler => {
  const headers = buildSecurityHeaders()

  return (_req, res, next) => {
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value)
    })
    next()
  }
}
