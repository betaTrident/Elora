import { describe, it, expect } from 'vitest'
import { ELORA_PRODUCTS, SAMPLE_RITUALS, resolveRituals } from './elora-catalog'

const IMAGE_ASSETS: Record<string, string> = {
  'nourishing-cleanser': 'product-nourishing-cleanser.png',
  'daily-hydration-gel': 'product-daily-hydration-gel.png',
  'glow-drops-serum': 'product-glow-drops-serum.png',
  'airy-sun-fluid-spf-50': 'product-airy-sun-fluid.png',
  'restorative-night-cream': 'product-restorative-night-cream.png',
  'balancing-toner': 'product-balancing-toner.png',
  'body-lotion': 'product-body-lotion.png',
  'body-oil': 'product-body-oil.png',
  'eau-de-parfum': 'product-eau-de-parfum.png',
  'soft-bloom': 'product-soft-bloom.png',
  'warm-skin': 'product-warm-skin.png',
  'bare-linen': 'product-bare-linen.png',
}

function fullProductMap() {
  return new Map(
    ELORA_PRODUCTS.map((p, i) => [
      p.handle,
      {
        productId: `gid://shopify/Product/${i + 1}`,
        variantId: `gid://shopify/ProductVariant/${i + 1}`,
      },
    ]),
  )
}

describe('ELORA_PRODUCTS', () => {
  it('lists twelve Elora SKUs with vendor Elora', () => {
    expect(ELORA_PRODUCTS).toHaveLength(12)
    expect(ELORA_PRODUCTS.every(p => p.vendor === 'Elora')).toBe(true)
  })

  it('includes the Elora Scent Wardrobe trio', () => {
    const bloom = ELORA_PRODUCTS.find(p => p.handle === 'soft-bloom')
    const warm = ELORA_PRODUCTS.find(p => p.handle === 'warm-skin')
    const linen = ELORA_PRODUCTS.find(p => p.handle === 'bare-linen')

    expect(bloom).toMatchObject({
      title: 'Soft Bloom',
      subtitle: 'Fertile Florals. Dewy & delicate.',
      size: '50 ml',
      price: 68,
      imageAsset: 'product-soft-bloom.png',
    })
    expect(bloom?.tags).toEqual(expect.arrayContaining(['elora:scent', 'scent:floral', 'wardrobe:soft-bloom']))

    expect(warm).toMatchObject({
      title: 'Warm Skin',
      subtitle: 'Amber. Soft. Comforting.',
      size: '50 ml',
      price: 68,
      imageAsset: 'product-warm-skin.png',
    })
    expect(warm?.tags).toEqual(expect.arrayContaining(['elora:scent', 'scent:warm', 'wardrobe:warm-skin']))

    expect(linen).toMatchObject({
      title: 'Bare Linen',
      subtitle: 'Clean. Crisp. Understated.',
      size: '50 ml',
      price: 68,
      imageAsset: 'product-bare-linen.png',
    })
    expect(linen?.tags).toEqual(expect.arrayContaining(['elora:scent', 'scent:clean', 'wardrobe:bare-linen']))
  })

  it('uses 13A theme asset filenames for imageAsset', () => {
    for (const product of ELORA_PRODUCTS) {
      expect(product.imageAsset).toBe(IMAGE_ASSETS[product.handle])
    }
  })

  it('includes catalog titles, sizes, prices, and builder tags', () => {
    const cleanser = ELORA_PRODUCTS.find(p => p.handle === 'nourishing-cleanser')
    expect(cleanser).toMatchObject({
      title: 'Nourishing Cleanser',
      subtitle: 'Chamomile & Oat Extract',
      size: '150 ml',
      price: 32,
    })
    expect(cleanser?.tags).toEqual(
      expect.arrayContaining([
        'concern:glow',
        'concern:calm',
        'moment:am',
        'moment:pm',
        'scent:unscented',
        'scent:clean',
      ]),
    )

    const serum = ELORA_PRODUCTS.find(p => p.handle === 'glow-drops-serum')
    expect(serum).toMatchObject({
      title: 'Glow Drops Serum',
      subtitle: 'Niacinamide + Kakadu Plum',
      size: '30 ml',
      price: 52,
    })
    expect(serum?.tags).toEqual(
      expect.arrayContaining(['concern:glow', 'moment:am', 'scent:unscented', 'scent:clean']),
    )

    const sun = ELORA_PRODUCTS.find(p => p.handle === 'airy-sun-fluid-spf-50')
    expect(sun).toMatchObject({
      title: 'Airy Sun Fluid SPF 50',
      price: 36,
      imageAsset: 'product-airy-sun-fluid.png',
    })
    expect(sun?.tags).toEqual(
      expect.arrayContaining(['concern:glow', 'moment:am', 'scent:unscented', 'scent:clean']),
    )
  })

  it('keeps scent:unscented and adds scent:clean on AM Glow SKUs', () => {
    const amGlowHandles = ['nourishing-cleanser', 'glow-drops-serum', 'airy-sun-fluid-spf-50']
    for (const handle of amGlowHandles) {
      const product = ELORA_PRODUCTS.find(p => p.handle === handle)
      expect(product?.tags).toEqual(expect.arrayContaining(['scent:unscented', 'scent:clean']))
    }
  })
})

describe('SAMPLE_RITUALS', () => {
  it('defines three named demo rituals', () => {
    expect(SAMPLE_RITUALS).toHaveLength(3)
    expect(SAMPLE_RITUALS.map(r => r.title)).toEqual([
      'AM Glow Ritual',
      'Body Ritual',
      'Night Barrier',
    ])
  })

  it('uses glow-drops-serum as the AM Glow treat step', () => {
    const amGlow = SAMPLE_RITUALS.find(r => r.title === 'AM Glow Ritual')
    expect(amGlow).toMatchObject({
      description: 'Morning face routine for radiant skin',
      scoreThreshold: 75,
    })
    expect(amGlow?.components).toEqual([
      { handle: 'nourishing-cleanser', role: 'cleanse' },
      { handle: 'glow-drops-serum', role: 'treat' },
      { handle: 'airy-sun-fluid-spf-50', role: 'seal' },
    ])
  })

  it('maps Body Ritual and Night Barrier to photographed SKUs', () => {
    const body = SAMPLE_RITUALS.find(r => r.title === 'Body Ritual')
    expect(body).toMatchObject({
      description: 'After-shower body ritual with matching scent',
      scoreThreshold: 70,
    })
    expect(body?.components).toEqual([
      { handle: 'nourishing-cleanser', role: 'cleanse' },
      { handle: 'body-lotion', role: 'seal' },
      { handle: 'body-oil', role: 'scent' },
    ])

    const night = SAMPLE_RITUALS.find(r => r.title === 'Night Barrier')
    expect(night).toMatchObject({
      description: 'PM skin recovery and barrier support',
      scoreThreshold: 70,
    })
    expect(night?.components).toEqual([
      { handle: 'nourishing-cleanser', role: 'cleanse' },
      { handle: 'balancing-toner', role: 'treat' },
      { handle: 'restorative-night-cream', role: 'seal' },
    ])
  })

  it('does not embed Shopify product GIDs', () => {
    const serialized = JSON.stringify(SAMPLE_RITUALS)
    expect(serialized).not.toMatch(/gid:\/\/shopify/i)
    expect(serialized).not.toContain('shopifyProductId')
  })
})

describe('resolveRituals', () => {
  it('returns no rituals and no fake GIDs when the product map is empty', () => {
    const resolved = resolveRituals(new Map())
    expect(resolved).toEqual([])
    expect(JSON.stringify(resolved)).not.toMatch(/gid:\/\/shopify/i)
  })

  it('resolves all three rituals when every handle has a product id', () => {
    const resolved = resolveRituals(fullProductMap())
    expect(resolved).toHaveLength(3)

    const amGlow = resolved.find(r => r.title === 'AM Glow Ritual')
    const serum = ELORA_PRODUCTS.find(p => p.handle === 'glow-drops-serum')!
    const serumIds = fullProductMap().get('glow-drops-serum')!

    expect(amGlow?.scoreThreshold).toBe(75)
    expect(amGlow?.components.find(c => c.role === 'treat')).toEqual(
      expect.objectContaining({
        role: 'treat',
        shopifyProductId: serumIds.productId,
        shopifyVariantId: serumIds.variantId,
        productTitleCache: serum.title,
        quantity: 1,
      }),
    )
    expect(amGlow?.components.every(c => c.shopifyProductId.startsWith('gid://shopify/Product/'))).toBe(true)
  })

  it('skips a ritual when any component handle is missing', () => {
    const map = fullProductMap()
    map.delete('glow-drops-serum')

    const resolved = resolveRituals(map)
    expect(resolved.map(r => r.title)).toEqual(['Body Ritual', 'Night Barrier'])
  })
})
