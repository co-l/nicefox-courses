import { getJwtSecret } from 'nicefox-auth'

export type LeanGraphMode = 'local' | 'remote' | 'test'

type Environment = Record<string, string | undefined>

const resolveDefaultModeFromNodeEnv = (nodeEnv: string | undefined): LeanGraphMode => {
  if (nodeEnv === 'production') {
    return 'remote'
  }

  if (nodeEnv === 'test') {
    return 'test'
  }

  return 'local'
}

const resolveLeanGraphMode = (mode: string | undefined): LeanGraphMode => {
  if (mode === 'local' || mode === 'remote' || mode === 'test') {
    return mode
  }

  return resolveDefaultModeFromNodeEnv(undefined)
}

export type LeanGraphConfig = {
  mode: LeanGraphMode
  url: string
  project: string
  apiKey: string
}

export const createLeanGraphConfig = (env: Environment): LeanGraphConfig => {
  const explicitMode = env.LEANGRAPH_MODE ?? env.GRAPHDB_MODE
  const mode = explicitMode
    ? resolveLeanGraphMode(explicitMode)
    : resolveDefaultModeFromNodeEnv(env.NODE_ENV)

  return {
    mode,
    url: env.LEANGRAPH_URL ?? 'https://leangraph.io',
    project: env.LEANGRAPH_PROJECT ?? env.GRAPHDB_PROJECT ?? 'stock',
    apiKey: env.LEANGRAPH_API_KEY ?? env.GRAPHDB_API_KEY ?? '',
  }
}

export const config = {
  port: parseInt(process.env.PORT || '3100', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  leangraph: createLeanGraphConfig(process.env),

  // Auth (uses getJwtSecret which auto-detects localhost)
  jwtSecret: getJwtSecret(),

  // CORS
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
}
