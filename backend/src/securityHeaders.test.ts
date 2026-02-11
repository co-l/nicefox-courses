import test from 'node:test'
import assert from 'node:assert/strict'
import { buildSecurityHeaders } from './securityHeaders.js'

test('buildSecurityHeaders returns required hardened headers', () => {
  const headers = buildSecurityHeaders()

  assert.equal(headers['Referrer-Policy'], 'no-referrer')
  assert.equal(headers['Permissions-Policy'], 'geolocation=(), microphone=(), camera=()')
  assert.equal(headers['X-Frame-Options'], 'DENY')
  assert.equal(headers['X-Content-Type-Options'], 'nosniff')
  assert.equal(headers['Strict-Transport-Security'], 'max-age=31536000; includeSubDomains')
})
