export interface EloraProduct {
  handle: string
  title: string
  subtitle: string
  size: string
  price: number
  tags: string[]
  imageAsset: string
  vendor: 'Elora'
}

export interface SampleRitualComponent {
  handle: string
  role: 'cleanse' | 'treat' | 'seal' | 'scent'
}

export interface SampleRitual {
  title: string
  description: string
  scoreThreshold: number
  components: SampleRitualComponent[]
}

export interface ResolvedProductIds {
  productId: string
  variantId: string | null
}

export interface ResolvedRitual {
  title: string
  description?: string
  scoreThreshold?: number
  components: Array<{
    shopifyProductId: string
    shopifyVariantId?: string | null
    productTitleCache?: string
    role: SampleRitualComponent['role']
    quantity: number
    sortOrder: number
  }>
}

export const ELORA_PRODUCTS: EloraProduct[] = [
  {
    handle: 'nourishing-cleanser',
    title: 'Nourishing Cleanser',
    subtitle: 'Chamomile & Oat Extract',
    size: '150 ml',
    price: 32,
    tags: ['concern:glow', 'concern:calm', 'moment:am', 'moment:pm', 'scent:unscented', 'scent:clean'],
    imageAsset: 'product-nourishing-cleanser.png',
    vendor: 'Elora',
  },
  {
    handle: 'daily-hydration-gel',
    title: 'Daily Hydration Gel',
    subtitle: 'Hyaluronic Acid + Aloe Vera',
    size: '50 ml',
    price: 48,
    tags: ['concern:hydrate', 'concern:barrier', 'moment:am', 'scent:unscented'],
    imageAsset: 'product-daily-hydration-gel.png',
    vendor: 'Elora',
  },
  {
    handle: 'glow-drops-serum',
    title: 'Glow Drops Serum',
    subtitle: 'Niacinamide + Kakadu Plum',
    size: '30 ml',
    price: 52,
    tags: ['concern:glow', 'moment:am', 'scent:unscented', 'scent:clean'],
    imageAsset: 'product-glow-drops-serum.png',
    vendor: 'Elora',
  },
  {
    handle: 'airy-sun-fluid-spf-50',
    title: 'Airy Sun Fluid SPF 50',
    subtitle: 'Broad Spectrum UVA + UVB',
    size: '50 ml',
    price: 36,
    tags: ['concern:glow', 'moment:am', 'scent:unscented', 'scent:clean'],
    imageAsset: 'product-airy-sun-fluid.png',
    vendor: 'Elora',
  },
  {
    handle: 'restorative-night-cream',
    title: 'Restorative Night Cream',
    subtitle: 'Bakuchiol + Squalane',
    size: '50 ml',
    price: 58,
    tags: ['concern:barrier', 'concern:calm', 'moment:pm', 'scent:unscented'],
    imageAsset: 'product-restorative-night-cream.png',
    vendor: 'Elora',
  },
  {
    handle: 'balancing-toner',
    title: 'Balancing Toner',
    subtitle: 'Green Tea + Witch Hazel',
    size: '200 ml',
    price: 34,
    tags: ['concern:calm', 'moment:am', 'moment:pm', 'scent:unscented'],
    imageAsset: 'product-balancing-toner.png',
    vendor: 'Elora',
  },
  {
    handle: 'body-lotion',
    title: 'Body Lotion',
    subtitle: 'Shea Butter + Niacinamide',
    size: '250 ml',
    price: 36,
    tags: ['concern:hydrate', 'moment:body', 'scent:warm', 'wardrobe:warm-skin'],
    imageAsset: 'product-body-lotion.png',
    vendor: 'Elora',
  },
  {
    handle: 'body-oil',
    title: 'Body Oil',
    subtitle: 'Jojoba + Camellia Oil',
    size: '100 ml',
    price: 42,
    tags: ['concern:glow', 'moment:body', 'scent:warm', 'wardrobe:warm-skin'],
    imageAsset: 'product-body-oil.png',
    vendor: 'Elora',
  },
  {
    handle: 'eau-de-parfum',
    title: 'Eau de Parfum',
    subtitle: 'Warm Florals + Soft Woods',
    size: '50 ml',
    price: 72,
    tags: ['concern:calm', 'moment:pm', 'moment:body', 'scent:floral', 'scent:warm', 'elora:body', 'elora:sets', 'wardrobe:soft-bloom'],
    imageAsset: 'product-eau-de-parfum.png',
    vendor: 'Elora',
  },
  {
    handle: 'soft-bloom',
    title: 'Soft Bloom',
    subtitle: 'Fertile Florals. Dewy & delicate.',
    size: '50 ml',
    price: 68,
    tags: ['concern:calm', 'moment:pm', 'scent:floral', 'elora:scent', 'wardrobe:soft-bloom'],
    imageAsset: 'product-soft-bloom.png',
    vendor: 'Elora',
  },
  {
    handle: 'warm-skin',
    title: 'Warm Skin',
    subtitle: 'Amber. Soft. Comforting.',
    size: '50 ml',
    price: 68,
    tags: ['concern:hydrate', 'moment:body', 'scent:warm', 'elora:scent', 'elora:body', 'wardrobe:warm-skin'],
    imageAsset: 'product-warm-skin.png',
    vendor: 'Elora',
  },
  {
    handle: 'bare-linen',
    title: 'Bare Linen',
    subtitle: 'Clean. Crisp. Understated.',
    size: '50 ml',
    price: 68,
    tags: ['concern:calm', 'moment:am', 'scent:clean', 'elora:scent', 'wardrobe:bare-linen'],
    imageAsset: 'product-bare-linen.png',
    vendor: 'Elora',
  },
]

export const SAMPLE_RITUALS: SampleRitual[] = [
  {
    title: 'AM Glow Ritual',
    description: 'Morning face routine for radiant skin',
    scoreThreshold: 75,
    components: [
      { handle: 'nourishing-cleanser', role: 'cleanse' },
      { handle: 'glow-drops-serum', role: 'treat' },
      { handle: 'airy-sun-fluid-spf-50', role: 'seal' },
    ],
  },
  {
    title: 'Body Ritual',
    description: 'After-shower body ritual with matching scent',
    scoreThreshold: 70,
    components: [
      { handle: 'nourishing-cleanser', role: 'cleanse' },
      { handle: 'body-lotion', role: 'seal' },
      { handle: 'body-oil', role: 'scent' },
    ],
  },
  {
    title: 'Night Barrier',
    description: 'PM skin recovery and barrier support',
    scoreThreshold: 70,
    components: [
      { handle: 'nourishing-cleanser', role: 'cleanse' },
      { handle: 'balancing-toner', role: 'treat' },
      { handle: 'restorative-night-cream', role: 'seal' },
    ],
  },
]

export function resolveRituals(productsByHandle: Map<string, ResolvedProductIds>): ResolvedRitual[] {
  const titleByHandle = new Map(ELORA_PRODUCTS.map(product => [product.handle, product.title]))
  const resolved: ResolvedRitual[] = []

  for (const ritual of SAMPLE_RITUALS) {
    const ids = ritual.components.map(component => productsByHandle.get(component.handle))
    if (ids.some(entry => !entry?.productId)) continue

    resolved.push({
      title: ritual.title,
      description: ritual.description,
      scoreThreshold: ritual.scoreThreshold,
      components: ritual.components.map((component, index) => {
        const entry = productsByHandle.get(component.handle)!
        return {
          shopifyProductId: entry.productId,
          shopifyVariantId: entry.variantId,
          productTitleCache: titleByHandle.get(component.handle),
          role: component.role,
          quantity: 1,
          sortOrder: index,
        }
      }),
    })
  }

  return resolved
}
