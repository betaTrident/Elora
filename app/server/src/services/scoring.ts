export interface ComponentInput {
  role: 'cleanse' | 'treat' | 'seal' | 'scent'
  shopifyProductId: string
  shopifyVariantId?: string | null
  unitCost?: number | null
}

export interface InventoryInfo {
  productId: string
  variantId?: string
  available: number
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED'
  price: string
}

export interface ScoreBreakdown {
  availability: number
  availabilityMax: number
  completeness: number
  completenessMax: number
  margin: number
  marginMax: number
  total: number
  factors: Array<{ productId: string; available: boolean; reason: string }>
}

const REQUIRED_ROLES = ['cleanse', 'treat', 'seal'] as const

export function calculateHealthScore(
  components: ComponentInput[],
  inventory: InventoryInfo[],
): { score: number; breakdown: ScoreBreakdown } {
  if (components.length === 0) {
    return {
      score: 0,
      breakdown: {
        availability: 0,
        availabilityMax: 50,
        completeness: 0,
        completenessMax: 20,
        margin: 0,
        marginMax: 30,
        total: 0,
        factors: [],
      },
    }
  }

  const inventoryMap = new Map(inventory.map(i => [i.productId, i]))
  const factors: ScoreBreakdown['factors'] = []

  let availableCount = 0
  components.forEach(c => {
    const inv = inventoryMap.get(c.shopifyProductId)
    const available = !!inv && inv.available > 0 && inv.status === 'ACTIVE'
    availableCount += available ? 1 : 0
    factors.push({
      productId: c.shopifyProductId,
      available,
      reason: !inv
        ? 'Product not found'
        : inv.status !== 'ACTIVE'
          ? `Product is ${inv.status}`
          : inv.available === 0
            ? 'Out of stock'
            : 'In stock',
    })
  })
  const availability = Math.round((availableCount / components.length) * 50)

  const presentRoles = new Set(components.map(c => c.role))
  const requiredPresent = REQUIRED_ROLES.filter(r => presentRoles.has(r)).length
  const completeness = Math.round((requiredPresent / REQUIRED_ROLES.length) * 20)

  const withCosts = components.filter(c => c.unitCost != null && c.unitCost > 0)
  let margin = 15
  if (withCosts.length > 0) {
    const avgMargin =
      withCosts.reduce((sum, c) => {
        const inv = inventoryMap.get(c.shopifyProductId)
        const price = inv ? parseFloat(inv.price) : 0
        const cost = c.unitCost!
        return sum + (price > 0 ? Math.max(0, Math.min(1, (price - cost) / price)) : 0)
      }, 0) / withCosts.length
    margin = Math.round(avgMargin * 30)
  }

  const total = availability + completeness + margin

  return {
    score: total,
    breakdown: {
      availability,
      availabilityMax: 50,
      completeness,
      completenessMax: 20,
      margin,
      marginMax: 30,
      total,
      factors,
    },
  }
}
