import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSelect = vi.fn()

vi.mock('../db/client', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
  },
}))

import { getDashboardData } from '../services/dashboard'

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

function stubQueries(rituals: unknown[], alerts: unknown[], activity: unknown[]) {
  const ritualsQuery = createThenableChain(rituals)
  const alertsQuery = createThenableChain(alerts)
  const activityQuery = createThenableChain(activity)
  mockSelect
    .mockReturnValueOnce(ritualsQuery)
    .mockReturnValueOnce(alertsQuery)
    .mockReturnValueOnce(activityQuery)
  return { ritualsQuery, alertsQuery, activityQuery }
}

const SHOP_ID = 'shop-id-1'

describe('getDashboardData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns zeros and empty arrays when shop has no data', async () => {
    stubQueries([], [{ count: 0 }], [])

    const result = await getDashboardData(SHOP_ID)

    expect(result).toEqual({
      counts: { total: 0, healthy: 0, broken: 0, unscored: 0, openAlerts: 0 },
      worst5: [],
      recentActivity: [],
    })
  })

  it('counts healthy, broken, and unscored rituals and ranks worst5 by lastScore', async () => {
    const rituals = [
      { id: '1', title: 'Healthy high', lastScore: 90, scoreThreshold: 70 },
      { id: '2', title: 'Broken mid', lastScore: 40, scoreThreshold: 70 },
      { id: '3', title: 'Unscored', lastScore: null, scoreThreshold: 70 },
      { id: '4', title: 'Worst', lastScore: 10, scoreThreshold: 70 },
      { id: '5', title: 'Broken 55', lastScore: 55, scoreThreshold: 70 },
      { id: '6', title: 'Healthy at threshold', lastScore: 70, scoreThreshold: 70 },
      { id: '7', title: 'Broken 20', lastScore: 20, scoreThreshold: 70 },
      { id: '8', title: 'Broken 30', lastScore: 30, scoreThreshold: 70 },
    ]
    stubQueries(rituals, [{ count: 0 }], [])

    const result = await getDashboardData(SHOP_ID)

    expect(result.counts).toEqual({
      total: 8,
      healthy: 2,
      broken: 5,
      unscored: 1,
      openAlerts: 0,
    })
    expect(result.worst5.map((r) => r.id)).toEqual(['4', '7', '8', '2', '5'])
    expect(result.worst5).toHaveLength(5)
    expect(result.worst5.every((r) => r.lastScore !== null)).toBe(true)
  })

  it('counts open alerts from the aggregate query', async () => {
    stubQueries([], [{ count: 3 }], [])

    const result = await getDashboardData(SHOP_ID)

    expect(result.counts.openAlerts).toBe(3)
    expect(result.counts.total).toBe(0)
  })

  it('limits recent activity to 5', async () => {
    const activity = [
      { id: 'a1', summary: 'one', createdAt: new Date('2026-08-13T01:00:00Z') },
      { id: 'a2', summary: 'two', createdAt: new Date('2026-08-13T02:00:00Z') },
      { id: 'a3', summary: 'three', createdAt: new Date('2026-08-13T03:00:00Z') },
      { id: 'a4', summary: 'four', createdAt: new Date('2026-08-13T04:00:00Z') },
      { id: 'a5', summary: 'five', createdAt: new Date('2026-08-13T05:00:00Z') },
    ]
    const { activityQuery } = stubQueries([], [{ count: 0 }], activity)

    const result = await getDashboardData(SHOP_ID)

    expect(activityQuery.orderBy).toHaveBeenCalled()
    expect(activityQuery.limit).toHaveBeenCalledWith(5)
    expect(result.recentActivity).toEqual(activity)
    expect(result.recentActivity).toHaveLength(5)
  })
})
