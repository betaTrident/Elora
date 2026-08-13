import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSelect = vi.fn()

vi.mock('../db/client', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    insert: vi.fn(),
  },
}))

import { listActivity } from './activity'

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

const SHOP_ID = 'shop-1'

describe('listActivity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns an empty array when the shop has no logs', async () => {
    const query = createThenableChain([])
    mockSelect.mockReturnValueOnce(query)

    const result = await listActivity(SHOP_ID)

    expect(result).toEqual([])
    expect(query.where).toHaveBeenCalled()
  })

  it('returns newest first and caps at 100', async () => {
    const rows = Array.from({ length: 100 }, (_, i) => ({
      id: `a${i}`,
      summary: `event ${i}`,
      createdAt: new Date(2026, 0, 1, 0, 0, i),
    }))
    const query = createThenableChain(rows)
    mockSelect.mockReturnValueOnce(query)

    const result = await listActivity(SHOP_ID)

    expect(query.orderBy).toHaveBeenCalled()
    expect(query.limit).toHaveBeenCalledWith(100)
    expect(result).toHaveLength(100)
  })

  it('caps a requested limit above 100', async () => {
    const query = createThenableChain([])
    mockSelect.mockReturnValueOnce(query)

    await listActivity(SHOP_ID, { limit: 500 })

    expect(query.limit).toHaveBeenCalledWith(100)
  })

  it('filters by actorType', async () => {
    const rows = [{ id: 'a1', actorType: 'merchant', summary: 'Created routine "X"' }]
    const query = createThenableChain(rows)
    mockSelect.mockReturnValueOnce(query)

    const result = await listActivity(SHOP_ID, { actorType: 'merchant' })

    expect(query.where).toHaveBeenCalled()
    expect(result).toEqual(rows)
  })

  it('filters by action', async () => {
    const rows = [{ id: 'a1', action: 'ritual.created', summary: 'Created routine "X"' }]
    const query = createThenableChain(rows)
    mockSelect.mockReturnValueOnce(query)

    const result = await listActivity(SHOP_ID, { action: 'ritual.created' })

    expect(query.where).toHaveBeenCalled()
    expect(result).toEqual(rows)
  })
})
