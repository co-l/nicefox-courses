import test from 'node:test'
import assert from 'node:assert/strict'
import { createLeanGraphConfig } from './config.js'

test('createLeanGraphConfig prefers LEANGRAPH env vars', () => {
  const graph = createLeanGraphConfig({
    LEANGRAPH_MODE: 'test',
    LEANGRAPH_URL: 'https://leangraph.example.test',
    LEANGRAPH_PROJECT: 'courses-test',
    LEANGRAPH_API_KEY: 'lg_test',
    GRAPHDB_MODE: 'remote',
    GRAPHDB_URL: 'https://legacy.example.test',
    GRAPHDB_PROJECT: 'legacy-project',
    GRAPHDB_API_KEY: 'legacy-key',
  })

  assert.deepEqual(graph, {
    mode: 'test',
    url: 'https://leangraph.example.test',
    project: 'courses-test',
    apiKey: 'lg_test',
  })
})

test('createLeanGraphConfig falls back to GRAPHDB project/api and defaults mode to local in development', () => {
  const graph = createLeanGraphConfig({
    NODE_ENV: 'development',
    GRAPHDB_URL: 'https://legacy.example.test',
    GRAPHDB_PROJECT: 'legacy-project',
    GRAPHDB_API_KEY: 'legacy-key',
  })

  assert.deepEqual(graph, {
    mode: 'local',
    url: 'https://leangraph.io',
    project: 'legacy-project',
    apiKey: 'legacy-key',
  })
})

test('createLeanGraphConfig defaults mode to remote in production', () => {
  const graph = createLeanGraphConfig({
    NODE_ENV: 'production',
    GRAPHDB_PROJECT: 'legacy-project',
    GRAPHDB_API_KEY: 'legacy-key',
  })

  assert.deepEqual(graph, {
    mode: 'remote',
    url: 'https://leangraph.io',
    project: 'legacy-project',
    apiKey: 'legacy-key',
  })
})

test('createLeanGraphConfig ignores legacy GRAPHDB_URL and defaults to LeanGraph host', () => {
  const graph = createLeanGraphConfig({
    NODE_ENV: 'production',
    GRAPHDB_URL: 'https://graphdb.nicefox.net',
    GRAPHDB_PROJECT: 'legacy-project',
    GRAPHDB_API_KEY: 'legacy-key',
  })

  assert.equal(graph.url, 'https://leangraph.io')
})
