import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()

vi.mock('../db/client', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    insert: (...args: unknown[]) => mockInsert(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
  },
}))

vi.mock('./activity', () => ({
  logActivity: vi.fn(),
}))

import { upsertAlerts, listOpenAlerts, resolveAlert } from './alerts'
import { logActivity } from './activity'
import type { ScoreBreakdown } from './scoring'

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

function stubInsert() {
  const valuesFn = vi.fn().mockResolvedValue(undefined)
  mockInsert.mockReturnValue({ values: valuesFn })
  return valuesFn
}

function stubUpdate() {
  const setFn = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) })
  mockUpdate.mockReturnValue({ set: setFn })
  return setFn
}

const healthyBreakdown: ScoreBreakdown = {
  availability: 50,
  availabilityMax: 50,
  completeness: 20,
  completenessMax: 20,
  margin: 15,
  marginMax: 30,
  total: 85,
  factors: [{ productId: 'p1', available: true, reason: 'In stock' }],
}

const unavailableBreakdown: ScoreBreakdown = {
  availability: 0,
  availabilityMax: 50,
  completeness: 7,
  completenessMax: 20,
  margin: 15,
  marginMax: 30,
  total: 22,
  factors: [{ productId: 'p1', available: false, reason: 'Out of stock' }],
}

const SHOP_ID = 'shop-1'
const RITUAL_ID = 'ritual-1'

describe('upsertAlerts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    stubInsert()
    stubUpdate()
  })

  it('does not open low_score when score is exactly at threshold', async () => {
    mockSelect.mockReturnValueOnce(createThenableChain([]))
    const valuesFn = stubInsert()

    await upsertAlerts(SHOP_ID, RITUAL_ID, 70, 70, healthyBreakdown)

    expect(valuesFn).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'low_score' }),
    )
    const lowScoreCalls = valuesFn.mock.calls.filter(
      ([row]) => (row as { type: string }).type === 'low_score',
    )
    expect(lowScoreCalls).toHaveLength(0)
  })

  it('opens low_score when score below threshold', async () => {
    mockSelect.mockReturnValueOnce(createThenableChain([]))
    const valuesFn = stubInsert()

    await upsertAlerts(SHOP_ID, RITUAL_ID, 50, 70, healthyBreakdown)

    expect(valuesFn).toHaveBeenCalledWith(
      expect.objectContaining({
        shopId: SHOP_ID,
        ritualId: RITUAL_ID,
        type: 'low_score',
        severity: 'warning',
        message: 'Routine score 50 is below threshold 70',
      }),
    )
    expect(logActivity).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        shopId: SHOP_ID,
        actorType: 'system',
        action: 'alert.opened',
        entityType: 'alert',
        summary: 'Routine score 50 is below threshold 70',
      }),
    )
  })

  it('opens component_unavailable when a factor is unavailable', async () => {
    mockSelect.mockReturnValueOnce(createThenableChain([]))
    const valuesFn = stubInsert()

    await upsertAlerts(SHOP_ID, RITUAL_ID, 80, 70, unavailableBreakdown)

    expect(valuesFn).toHaveBeenCalledWith(
      expect.objectContaining({
        shopId: SHOP_ID,
        ritualId: RITUAL_ID,
        type: 'component_unavailable',
        severity: 'critical',
        message: 'Product p1: Out of stock',
      }),
    )
  })

  it('resolves when the issue is gone', async () => {
    const openAlert = {
      id: 'alert-1',
      shopId: SHOP_ID,
      ritualId: RITUAL_ID,
      type: 'low_score' as const,
      severity: 'warning' as const,
      message: 'Routine score 50 is below threshold 70',
      status: 'open' as const,
    }
    mockSelect.mockReturnValueOnce(createThenableChain([openAlert]))
    const setFn = stubUpdate()

    await upsertAlerts(SHOP_ID, RITUAL_ID, 85, 70, healthyBreakdown)

    expect(setFn).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'resolved',
        resolvedAt: expect.any(Date),
      }),
    )
    expect(logActivity).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        shopId: SHOP_ID,
        actorType: 'system',
        action: 'alert.resolved',
        entityType: 'alert',
        entityId: 'alert-1',
        summary: 'Alert resolved: Routine score 50 is below threshold 70',
      }),
    )
  })

  it('does not insert a duplicate open alert of the same type', async () => {
    const valuesFn = stubInsert()

    mockSelect.mockReturnValueOnce(createThenableChain([]))
    await upsertAlerts(SHOP_ID, RITUAL_ID, 50, 70, healthyBreakdown)

    expect(valuesFn).toHaveBeenCalledTimes(1)
    const inserted = valuesFn.mock.calls[0][0] as { id: string; type: string }

    valuesFn.mockClear()
    mockSelect.mockReturnValueOnce(
      createThenableChain([
        {
          id: inserted.id,
          shopId: SHOP_ID,
          ritualId: RITUAL_ID,
          type: 'low_score',
          status: 'open',
          message: 'Routine score 50 is below threshold 70',
        },
      ]),
    )

    await upsertAlerts(SHOP_ID, RITUAL_ID, 50, 70, healthyBreakdown)

    expect(valuesFn).not.toHaveBeenCalled()
  })
})

describe('listOpenAlerts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns only that shop's open rows", async () => {
    const rows = [
      {
        id: 'a1',
        ritualId: RITUAL_ID,
        type: 'low_score',
        severity: 'warning',
        message: 'Routine score 50 is below threshold 70',
        status: 'open',
        createdAt: new Date('2026-08-13T00:00:00.000Z'),
      },
    ]
    const query = createThenableChain(rows)
    mockSelect.mockReturnValueOnce(query)

    const result = await listOpenAlerts(SHOP_ID)

    expect(query.where).toHaveBeenCalled()
    expect(query.orderBy).toHaveBeenCalled()
    expect(result).toEqual(rows)
    expect(result.every(row => row.status === 'open')).toBe(true)
  })
})

describe('resolveAlert', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('marks resolved', async () => {
    const query = createThenableChain([
      { id: 'alert-1', shopId: SHOP_ID, status: 'open' },
    ])
    mockSelect.mockReturnValueOnce(query)
    const setFn = stubUpdate()

    await resolveAlert(SHOP_ID, 'alert-1')

    expect(query.where).toHaveBeenCalled()
    expect(setFn).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'resolved',
        resolvedAt: expect.any(Date),
      }),
    )
  })

  it('throws 404 when missing', async () => {
    mockSelect.mockReturnValueOnce(createThenableChain([]))

    await expect(resolveAlert(SHOP_ID, 'missing-id')).rejects.toMatchObject({ status: 404 })
  })
})
