import { describe, it, expect, vi } from 'vitest'

vi.mock('../db/client', () => ({
  db: {
    select: vi.fn(),
  },
}))

import { availableFromInventoryQuantity } from './graphql'

describe('availableFromInventoryQuantity', () => {
  it('treats null inventoryQuantity as in-stock when untracked', () => {
    expect(availableFromInventoryQuantity(null)).toBeGreaterThan(0)
  })

  it('keeps 0 as out of stock', () => {
    expect(availableFromInventoryQuantity(0)).toBe(0)
  })

  it('passes through tracked positive quantities', () => {
    expect(availableFromInventoryQuantity(12)).toBe(12)
  })

  it('treats missing quantity as out of stock', () => {
    expect(availableFromInventoryQuantity(undefined)).toBe(0)
  })
})
