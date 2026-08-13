import { describe, it, expect } from 'vitest'
import { calculateHealthScore } from './scoring'

const makeInv = (productId: string, available = 10, status: 'ACTIVE' | 'DRAFT' = 'ACTIVE', price = '25.00') =>
  ({ productId, available, status, price })

const components = [
  { role: 'cleanse' as const, shopifyProductId: 'p1' },
  { role: 'treat' as const, shopifyProductId: 'p2' },
  { role: 'seal' as const, shopifyProductId: 'p3' },
]

describe('calculateHealthScore', () => {
  it('returns 100 max for fully stocked kit with costs', () => {
    const inv = [makeInv('p1'), makeInv('p2'), makeInv('p3')]
    const compsWithCost = components.map(c => ({ ...c, unitCost: 8 }))
    const { score } = calculateHealthScore(compsWithCost, inv)
    expect(score).toBeGreaterThanOrEqual(80)
  })

  it('returns 0 for empty components', () => {
    const { score } = calculateHealthScore([], [])
    expect(score).toBe(0)
  })

  it('penalises OOS product', () => {
    const inv = [makeInv('p1', 0), makeInv('p2'), makeInv('p3')]
    const { breakdown } = calculateHealthScore(components, inv)
    expect(breakdown.availability).toBeLessThan(50)
    expect(breakdown.factors.find(f => f.productId === 'p1')?.available).toBe(false)
  })

  it('penalises missing required role', () => {
    const partial = [{ role: 'cleanse' as const, shopifyProductId: 'p1' }]
    const inv = [makeInv('p1')]
    const { breakdown } = calculateHealthScore(partial, inv)
    expect(breakdown.completeness).toBeLessThan(20)
  })

  it('awards mid margin when no costs set', () => {
    const inv = [makeInv('p1'), makeInv('p2'), makeInv('p3')]
    const { breakdown } = calculateHealthScore(components, inv)
    expect(breakdown.margin).toBe(15)
  })
})
