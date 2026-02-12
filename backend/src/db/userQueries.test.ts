import assert from 'node:assert/strict'
import test from 'node:test'

import { FIND_USER_BY_AUTH_ID_QUERY } from './userQueries.js'

test('FIND_USER_BY_AUTH_ID_QUERY deterministically picks latest duplicate user', () => {
  assert.doesNotMatch(FIND_USER_BY_AUTH_ID_QUERY, /OPTIONAL MATCH \(i:Stock_Item \{userId: u\.id\}\)/)
  // Standard Cypher: RETURN before ORDER BY before LIMIT
  assert.match(FIND_USER_BY_AUTH_ID_QUERY, /RETURN u\s+ORDER BY u\.createdAt DESC\s+LIMIT 1/)
})
