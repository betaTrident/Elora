import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSelect = vi.fn()
const mockInsert = vi.fn()

vi.mock('../db/client', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    insert: (...args: unknown[]) => mockInsert(...args),
  },
}))

vi.mock('./activity', () => ({
  logActivity: vi.fn(),
}))

import { getSettings, updateSettings } from './settings'
import { logActivity } from './activity'

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

function stubUpsert() {
  const onDuplicateKeyUpdate = vi.fn().mockResolvedValue(undefined)
  const values = vi.fn().mockReturnValue({ onDuplicateKeyUpdate })
  mockInsert.mockReturnValue({ values })
  return { values, onDuplicateKeyUpdate }
}

const SHOP = { shopDomain: 'test.myshopify.com', shopId: 'shop-1', userId: 'user-1' }

describe('getSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns { defaultThreshold: 70 } when no row exists', async () => {
    mockSelect.mockReturnValueOnce(createThenableChain([]))

    const result = await getSettings(SHOP.shopId)

    expect(result).toEqual({ defaultThreshold: 70 })
  })

  it('returns the stored threshold when a row exists', async () => {
    mockSelect.mockReturnValueOnce(createThenableChain([{ shopId: SHOP.shopId, defaultThreshold: 80 }]))

    const result = await getSettings(SHOP.shopId)

    expect(result).toEqual({ defaultThreshold: 80 })
  })
})

describe('updateSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('upserts and returns the new threshold', async () => {
    const { values, onDuplicateKeyUpdate } = stubUpsert()

    const result = await updateSettings(SHOP, 85)

    expect(result).toEqual({ defaultThreshold: 85 })
    expect(values).toHaveBeenCalledWith({ shopId: SHOP.shopId, defaultThreshold: 85 })
    expect(onDuplicateKeyUpdate).toHaveBeenCalledWith({ set: { defaultThreshold: 85 } })
  })

  it('calls logActivity with settings.updated and the threshold summary', async () => {
    stubUpsert()

    await updateSettings(SHOP, 85)

    expect(logActivity).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        shopId: SHOP.shopId,
        actorType: 'merchant',
        actorId: SHOP.userId,
        action: 'settings.updated',
        entityType: 'shop_settings',
        summary: 'Default threshold set to 85',
        afterJson: { defaultThreshold: 85 },
      }),
    )
  })
})
