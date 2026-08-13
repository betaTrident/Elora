import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockTransaction = vi.fn()
const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()

vi.mock('../db/client', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    insert: (...args: unknown[]) => mockInsert(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
    transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}))

vi.mock('../shopify/graphql', () => ({
  fetchInventory: vi.fn(async () => [
    { productId: 'gid://shopify/Product/123', available: 10, status: 'ACTIVE' as const, price: '25.00' },
  ]),
}))

import {
  createRitual,
  getRitual,
  updateRitual,
  archiveRitual,
  listRituals,
  recalculateRitual,
} from './rituals'
import { fetchInventory } from '../shopify/graphql'

const SHOP = { shopDomain: 'test.myshopify.com', shopId: 'shop-1', userId: 'user-1' }

function createThenableChain<T>(result: T) {
  const chain = {
    from: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    then: (resolve: (value: T) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
  }
  chain.from.mockReturnValue(chain)
  chain.where.mockReturnValue(chain)
  chain.orderBy.mockReturnValue(chain)
  chain.limit.mockReturnValue(chain)
  return chain
}

function stubInsert(valuesImpl = vi.fn().mockResolvedValue(undefined)) {
  mockInsert.mockReturnValue({ values: valuesImpl })
}

function stubUpdate(setImpl = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) })) {
  mockUpdate.mockReturnValue({ set: setImpl })
}

const validBody = {
  title: 'Morning Routine',
  components: [
    {
      shopifyProductId: 'gid://shopify/Product/123',
      role: 'cleanse' as const,
      quantity: 1,
      sortOrder: 0,
    },
  ],
}

describe('rituals service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        insert: mockInsert,
        update: mockUpdate,
        delete: mockDelete,
      }
      return fn(tx)
    })
  })

  it('createRitual inserts ritual and components and returns score', async () => {
    const settingsQuery = createThenableChain([{ defaultThreshold: 70 }])
    mockSelect.mockReturnValueOnce(settingsQuery)
    stubInsert()
    stubUpdate()

    const result = await createRitual(SHOP, validBody)

    expect(result.id).toMatch(/^[0-9a-f-]{36}$/i)
    expect(result.score).toBeGreaterThan(0)
    expect(result.threshold).toBe(70)
    expect(result.breakdown).toBeDefined()
    expect(mockInsert).toHaveBeenCalled()
    expect(fetchInventory).toHaveBeenCalled()
  })

  it('createRitual persists and scores with empty inventory when fetchInventory fails', async () => {
    vi.mocked(fetchInventory).mockRejectedValueOnce(new Error('GraphQL error'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const settingsQuery = createThenableChain([{ defaultThreshold: 70 }])
    mockSelect.mockReturnValueOnce(settingsQuery)
    stubInsert()
    stubUpdate()

    const result = await createRitual(SHOP, validBody)

    expect(result.id).toMatch(/^[0-9a-f-]{36}$/i)
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.threshold).toBe(70)
    expect(mockInsert).toHaveBeenCalled()
    expect(fetchInventory).toHaveBeenCalled()
    expect(consoleSpy).toHaveBeenCalledWith('fetchInventory failed:', expect.any(Error))
    expect(result.breakdown.factors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          productId: 'gid://shopify/Product/123',
          available: false,
        }),
      ]),
    )

    consoleSpy.mockRestore()
  })

  it('getRitual returns 404 when ritual is missing', async () => {
    const ritualQuery = createThenableChain([])
    mockSelect.mockReturnValueOnce(ritualQuery)

    await expect(getRitual(SHOP.shopId, 'missing-id')).rejects.toMatchObject({ status: 404 })
  })

  it('archiveRitual sets status archived', async () => {
    const ritualQuery = createThenableChain([{ id: 'ritual-1', title: 'Test', status: 'active' }])
    mockSelect.mockReturnValueOnce(ritualQuery)
    const setFn = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) })
    stubUpdate(setFn)
    stubInsert()

    await archiveRitual(SHOP, 'ritual-1')

    expect(setFn).toHaveBeenCalledWith(expect.objectContaining({ status: 'archived' }))
  })

  it('listRituals defaults to active status', async () => {
    const ritualsQuery = createThenableChain([
      {
        id: 'r1',
        title: 'Active',
        lastScore: 80,
        scoreThreshold: 70,
        lastScoredAt: null,
        status: 'active',
        description: null,
      },
    ])
    mockSelect.mockReturnValueOnce(ritualsQuery)

    const result = await listRituals(SHOP.shopId)

    expect(result).toHaveLength(1)
    expect(ritualsQuery.where).toHaveBeenCalled()
  })

  it('updateRitual returns 404 when ritual is missing', async () => {
    const ritualQuery = createThenableChain([])
    mockSelect.mockReturnValueOnce(ritualQuery)

    await expect(updateRitual(SHOP, 'missing-id', validBody)).rejects.toMatchObject({ status: 404 })
  })

  it('recalculateRitual logs ritual.recalculated with a routine summary', async () => {
    const ritualQuery = createThenableChain([{ id: 'ritual-1', title: 'Morning Glow', shopId: 'shop-1' }])
    const componentsQuery = createThenableChain([
      {
        id: 'c1',
        ritualId: 'ritual-1',
        shopifyProductId: 'gid://shopify/Product/123',
        shopifyVariantId: null,
        role: 'cleanse',
        quantity: 1,
        unitCost: null,
        sortOrder: 0,
      },
    ])
    mockSelect.mockReturnValueOnce(ritualQuery).mockReturnValueOnce(componentsQuery)
    stubUpdate()
    const valuesFn = vi.fn().mockResolvedValue(undefined)
    stubInsert(valuesFn)

    const result = await recalculateRitual(SHOP, 'ritual-1')

    expect(result.score).toBeGreaterThan(0)
    expect(valuesFn).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ritual.recalculated',
        summary: 'Recalculated routine "Morning Glow"',
        afterJson: expect.objectContaining({ score: expect.any(Number) }),
      }),
    )
  })
})
