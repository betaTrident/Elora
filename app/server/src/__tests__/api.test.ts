import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import type { Express } from 'express'
import * as ritualsService from '../services/rituals'

const TEST_API_KEY = 'test-api-key'
const TEST_SECRET = 'test-secret'

const mockLimit = vi.fn()
const mockWhere = vi.fn(() => ({ limit: mockLimit }))
const mockFrom = vi.fn(() => ({ where: mockWhere }))
const mockSelect = vi.fn(() => ({ from: mockFrom }))

vi.mock('../db/client', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        onDuplicateKeyUpdate: vi.fn().mockResolvedValue(undefined),
      })),
    })),
  },
}))

vi.mock('../services/dashboard', () => ({
  getDashboardData: vi.fn(async () => ({
    counts: { total: 0, healthy: 0, broken: 0, unscored: 0, openAlerts: 0 },
    worst5: [],
    recentActivity: [],
  })),
}))

beforeAll(() => {
  process.env.VITEST = 'true'
  process.env.SHOPIFY_API_KEY = TEST_API_KEY
  process.env.SHOPIFY_API_SECRET = TEST_SECRET
  process.env.DATABASE_URL = 'mysql://test:test@localhost:3306/test'
  process.env.SHOPIFY_APP_URL = 'https://test.example.com'
  process.env.PORT = '3000'
})

let app: Express

function signToken(): string {
  return jwt.sign(
    {
      aud: TEST_API_KEY,
      dest: 'https://test-shop.myshopify.com',
      sub: 'user-123',
    },
    TEST_SECRET,
    { algorithm: 'HS256' },
  )
}

function authRequest(method: 'get' | 'post' | 'put', path: string) {
  mockLimit.mockResolvedValueOnce([{ id: 'shop-id-1' }])
  const token = signToken()
  return request(app)[method](path).set('Authorization', `Bearer ${token}`)
}

const validRitualBody = {
  title: 'Morning Ritual',
  components: [
    {
      shopifyProductId: 'gid://shopify/Product/123',
      role: 'cleanse' as const,
      quantity: 1,
    },
  ],
}

beforeAll(async () => {
  const mod = await import('../index')
  app = mod.app
})

beforeEach(() => {
  vi.clearAllMocks()
  mockSelect.mockReturnValue({ from: mockFrom })
  mockFrom.mockReturnValue({ where: mockWhere })
  mockWhere.mockReturnValue({ limit: mockLimit })
})

describe('requireAuth on API routes', () => {
  const protectedRoutes: Array<{ method: 'get' | 'post' | 'put'; path: string }> = [
    { method: 'get', path: '/api/dashboard' },
    { method: 'get', path: '/api/rituals' },
    { method: 'post', path: '/api/rituals' },
    { method: 'get', path: '/api/rituals/mock-id' },
    { method: 'put', path: '/api/rituals/mock-id' },
    { method: 'post', path: '/api/rituals/mock-id/archive' },
    { method: 'post', path: '/api/rituals/mock-id/recalculate' },
    { method: 'get', path: '/api/scores/mock-id' },
    { method: 'get', path: '/api/alerts' },
    { method: 'post', path: '/api/alerts/mock-id/resolve' },
    { method: 'get', path: '/api/activity' },
    { method: 'get', path: '/api/settings' },
    { method: 'put', path: '/api/settings' },
  ]

  it.each(protectedRoutes)('$method $path returns 401 without token', async ({ method, path }) => {
    const res = await request(app)[method](path)
    expect(res.status).toBe(401)
    expect(res.body).toEqual({ error: 'Missing token' })
  })
})

describe('GET /api/dashboard', () => {
  it('returns 200 with mock dashboard data', async () => {
    const res = await authRequest('get', '/api/dashboard')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      counts: { total: 0, healthy: 0, broken: 0, unscored: 0, openAlerts: 0 },
      worst5: [],
      recentActivity: [],
    })
  })
})

describe('POST /api/rituals', () => {
  it('returns 400 for empty body', async () => {
    const res = await authRequest('post', '/api/rituals').send({})
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Validation failed')
    expect(res.body.issues).toBeDefined()
  })

  it('returns 201 for valid body', async () => {
    const res = await authRequest('post', '/api/rituals').send(validRitualBody)
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      id: 'mock-ritual-id',
      score: 80,
      threshold: 70,
    })
  })
})

describe('GET /api/rituals/:id', () => {
  it('returns 404 when id is missing', async () => {
    const res = await authRequest('get', '/api/rituals/missing')
    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: 'Not found' })
  })
})

describe('PUT /api/rituals/:id', () => {
  it('returns 404 when id is missing', async () => {
    const res = await authRequest('put', '/api/rituals/missing').send(validRitualBody)
    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: 'Not found' })
  })
})

describe('PUT /api/settings', () => {
  it('returns 400 when defaultThreshold is out of range', async () => {
    const res = await authRequest('put', '/api/settings').send({ defaultThreshold: 200 })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Validation failed')
  })

  it('returns 200 for valid defaultThreshold', async () => {
    const res = await authRequest('put', '/api/settings').send({ defaultThreshold: 75 })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ defaultThreshold: 75 })
  })
})

describe('POST /webhooks/app/uninstalled', () => {
  it('returns 401 for invalid HMAC', async () => {
    const body = JSON.stringify({ shop_domain: 'test.myshopify.com' })
    const res = await request(app)
      .post('/webhooks/app/uninstalled')
      .set('Content-Type', 'application/json')
      .set('X-Shopify-Hmac-Sha256', 'invalid-hmac')
      .send(body)
    expect(res.status).toBe(401)
  })

  it('returns 200 for valid HMAC', async () => {
    const body = JSON.stringify({ shop_domain: 'test.myshopify.com' })
    const hmac = crypto.createHmac('sha256', TEST_SECRET).update(body).digest('base64')
    const res = await request(app)
      .post('/webhooks/app/uninstalled')
      .set('Content-Type', 'application/json')
      .set('X-Shopify-Hmac-Sha256', hmac)
      .send(body)
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
  })
})

describe('errorHandler', () => {
  it('returns 500 for unhandled errors', async () => {
    vi.spyOn(ritualsService, 'listRituals').mockRejectedValueOnce(new Error('Unexpected failure'))
    const res = await authRequest('get', '/api/rituals')
    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Internal server error' })
  })
})
