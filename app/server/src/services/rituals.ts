import { ShopContext } from '../shopify/auth'

export interface RitualComponent {
  shopifyProductId: string
  shopifyVariantId?: string
  role: 'cleanse' | 'treat' | 'seal' | 'scent'
  quantity: number
  unitCost?: number
  sortOrder: number
}

export interface CreateRitualBody {
  title: string
  description?: string
  scoreThreshold?: number
  components: RitualComponent[]
}

function notFound(id: string): void {
  if (id === 'missing') {
    throw Object.assign(new Error('Not found'), { status: 404 })
  }
}

function mockRitual(shopId: string, id: string, body?: Partial<CreateRitualBody>) {
  return {
    id,
    shopId,
    title: body?.title ?? 'Mock Ritual',
    description: body?.description ?? null,
    score: 80,
    breakdown: {},
    threshold: body?.scoreThreshold ?? 70,
    status: 'active' as const,
    components: body?.components ?? [
      {
        shopifyProductId: 'gid://shopify/Product/456',
        role: 'cleanse' as const,
        quantity: 1,
        sortOrder: 0,
      },
    ],
  }
}

export async function listRituals(_shopId: string, status?: string) {
  void status
  return [mockRitual(_shopId, 'mock-ritual-id')]
}

export async function createRitual(_shop: ShopContext, body: CreateRitualBody) {
  return {
    id: 'mock-ritual-id',
    score: 80,
    breakdown: {},
    threshold: body.scoreThreshold ?? 70,
  }
}

export async function getRitual(shopId: string, id: string) {
  notFound(id)
  return mockRitual(shopId, id)
}

export async function updateRitual(shop: ShopContext, id: string, body: CreateRitualBody) {
  notFound(id)
  return mockRitual(shop.shopId, id, body)
}

export async function archiveRitual(shop: ShopContext, id: string) {
  notFound(id)
}

export async function recalculateRitual(_shop: ShopContext, id: string) {
  notFound(id)
  return {
    score: 80,
    breakdown: { availability: 40, completeness: 20, margin: 15 },
  }
}
