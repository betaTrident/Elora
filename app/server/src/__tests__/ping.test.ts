import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import type { Express } from 'express'

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

beforeAll(() => {
  process.env.SHOPIFY_API_KEY = TEST_API_KEY
  process.env.SHOPIFY_API_SECRET = TEST_SECRET
  process.env.DATABASE_URL = 'mysql://test:test@localhost:3306/test'
  process.env.SHOPIFY_APP_URL = 'https://test.example.com'
  process.env.PORT = '3000'
})

let app: Express

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

describe('GET /api/ping', () => {
  it('returns 401 when Authorization header is missing', async () => {
    const res = await request(app).get('/api/ping')
    expect(res.status).toBe(401)
    expect(res.body).toEqual({ error: 'Missing token' })
  })

  it('returns 401 when token is not a valid JWT', async () => {
    const res = await request(app)
      .get('/api/ping')
      .set('Authorization', 'Bearer not-a-jwt')
    expect(res.status).toBe(401)
    expect(res.body).toEqual({ error: 'Invalid session token' })
  })

  it('returns 200 with shop domain when token is valid', async () => {
    mockLimit.mockResolvedValueOnce([{ id: 'shop-id-1' }])

    const token = jwt.sign(
      {
        aud: TEST_API_KEY,
        dest: 'https://test-shop.myshopify.com',
        sub: 'user-123',
      },
      TEST_SECRET,
      { algorithm: 'HS256' },
    )

    const res = await request(app)
      .get('/api/ping')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ shop: 'test-shop.myshopify.com' })
  })
})

describe('GET /health', () => {
  it('returns 200 without authentication', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
  })
})
