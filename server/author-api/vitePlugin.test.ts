import { randomUUID } from 'node:crypto'
import { createServer as createHttpServer, type Server as HttpServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { createServer as createViteServer } from 'vite'
import { generateQuestionBatch, generateSimulation } from './openaiClient.ts'
import { createAuthorApiPlugin } from './vitePlugin.ts'

vi.mock('./openaiClient.ts', async importOriginal => {
  const actual = await importOriginal<typeof import('./openaiClient.ts')>()
  const unexpectedProviderCall = () => Promise.reject(new Error('The provider must not be called by route rejection tests.'))

  return {
    ...actual,
    generateQuestionBatch: vi.fn(unexpectedProviderCall),
    generateSimulation: vi.fn(unexpectedProviderCall),
  }
})

const apiKey = 'sk-test-route-secret-never-expose'
const authorToken = `test-author-token-never-expose-${randomUUID()}`
const questionRoute = '/api/author/questions/generate'
const simulationRoute = '/api/author/simulations/generate'

type RunningServer = {
  origin: string
  close: () => Promise<void>
}

async function closeHttpServer(server: HttpServer) {
  await new Promise<void>((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve())
  })
}

async function startAuthorServer(config: Parameters<typeof createAuthorApiPlugin>[0]): Promise<RunningServer> {
  const vite = await createViteServer({
    appType: 'custom',
    configFile: false,
    logLevel: 'silent',
    plugins: [createAuthorApiPlugin(config)],
    server: { middlewareMode: true },
  })
  const http = createHttpServer(vite.middlewares)

  try {
    await new Promise<void>((resolve, reject) => {
      const onError = (error: Error) => reject(error)
      http.once('error', onError)
      http.listen(0, '127.0.0.1', () => {
        http.off('error', onError)
        resolve()
      })
    })
  } catch (error) {
    await vite.close()
    throw error
  }

  const address = http.address() as AddressInfo
  return {
    origin: `http://127.0.0.1:${address.port}`,
    close: async () => {
      try {
        await closeHttpServer(http)
      } finally {
        await vite.close()
      }
    },
  }
}

async function expectSafeError(response: Response, status: number, errorCode: string) {
  const responseText = await response.text()
  const responseHeaders = JSON.stringify([...response.headers.entries()])

  expect(response.status).toBe(status)
  expect(response.headers.get('content-type')).toContain('application/json')
  expect(response.headers.get('cache-control')).toBe('no-store')
  expect(`${responseHeaders}\n${responseText}`).not.toContain(apiKey)
  expect(`${responseHeaders}\n${responseText}`).not.toContain(authorToken)
  expect(JSON.parse(responseText)).toMatchObject({ error: errorCode })
}

describe('local Author API Vite middleware', { concurrent: false }, () => {
  let configuredServer: RunningServer
  let incompleteConfigServer: RunningServer

  beforeAll(async () => {
    configuredServer = await startAuthorServer({ apiKey, model: 'test-model', authorToken })
    try {
      incompleteConfigServer = await startAuthorServer({ apiKey, authorToken })
    } catch (error) {
      await configuredServer.close()
      throw error
    }
  })

  afterEach(() => {
    expect(generateQuestionBatch).not.toHaveBeenCalled()
    expect(generateSimulation).not.toHaveBeenCalled()
    vi.clearAllMocks()
  })

  afterAll(async () => {
    await Promise.all([
      configuredServer.close(),
      incompleteConfigServer.close(),
    ])
  })

  it.each([questionRoute, simulationRoute])('returns 503 for incomplete server configuration on %s', async route => {
    const response = await fetch(`${incompleteConfigServer.origin}${route}`, { method: 'POST' })

    await expectSafeError(response, 503, 'ai_not_configured')
  })

  it('rejects unsupported methods before processing the request', async () => {
    const response = await fetch(`${configuredServer.origin}${questionRoute}`, { method: 'GET' })

    await expectSafeError(response, 405, 'method_not_allowed')
    expect(response.headers.get('allow')).toBe('POST')
  })

  it('requires an application/json content type', async () => {
    const response = await fetch(`${configuredServer.origin}${questionRoute}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        Origin: configuredServer.origin,
        'X-TechFlow-Author-Token': authorToken,
      },
      body: '{}',
    })

    await expectSafeError(response, 415, 'json_required')
  })

  it.each([
    ['missing', undefined],
    ['cross-origin', 'http://attacker.example'],
  ])('rejects a %s Origin header', async (_case, origin) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-TechFlow-Author-Token': authorToken,
    }
    if (origin) headers.Origin = origin

    const response = await fetch(`${configuredServer.origin}${questionRoute}`, {
      method: 'POST',
      headers,
      body: '{}',
    })

    await expectSafeError(response, 403, 'origin_rejected')
  })

  it.each([
    ['missing', undefined],
    ['incorrect', 'incorrect-author-token'],
  ])('rejects the author token when it is %s', async (_case, suppliedToken) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Origin: configuredServer.origin,
    }
    if (suppliedToken) headers['X-TechFlow-Author-Token'] = suppliedToken

    const response = await fetch(`${configuredServer.origin}${questionRoute}`, {
      method: 'POST',
      headers,
      body: '{}',
    })

    await expectSafeError(response, 401, 'author_token_rejected')
  })

  it('rejects request bodies larger than the route limit', async () => {
    const response = await fetch(`${configuredServer.origin}${questionRoute}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: configuredServer.origin,
        'X-TechFlow-Author-Token': authorToken,
      },
      body: JSON.stringify({ padding: 'x'.repeat(33 * 1024) }),
    })

    await expectSafeError(response, 413, 'body_too_large')
  })

  it('rejects malformed JSON', async () => {
    const response = await fetch(`${configuredServer.origin}${questionRoute}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: configuredServer.origin,
        'X-TechFlow-Author-Token': authorToken,
      },
      body: '{',
    })

    await expectSafeError(response, 400, 'invalid_json')
  })

  it('rejects a schema-invalid request before calling the provider', async () => {
    const response = await fetch(`${configuredServer.origin}${simulationRoute}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: configuredServer.origin,
        'X-TechFlow-Author-Token': authorToken,
      },
      body: '{}',
    })

    await expectSafeError(response, 400, 'invalid_request')
  })
})
