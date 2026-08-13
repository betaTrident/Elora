import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../../..')
const GRAPHQL_DIR = path.join(__dirname, 'graphql')
const ASSETS_DIR = path.join(ROOT, 'theme', 'assets')
const STORE = 'elora-lg1vomev.myshopify.com'
const API_VERSION = '2025-10'
const ONLINE_STORE_PUBLICATION = 'gid://shopify/Publication/198058016907'
const FRONTPAGE_COLLECTION = 'gid://shopify/Collection/319940329611'

const SIZE_LABELS = {
  '150 ml': '150 ml / 5.0 fl. oz.',
  '50 ml': '50 ml / 1.7 fl. oz.',
  '30 ml': '30 ml / 1.0 fl. oz.',
  '200 ml': '200 ml / 6.7 fl. oz.',
  '250 ml': '250 ml / 8.4 fl. oz.',
  '100 ml': '100 ml / 3.4 fl. oz.',
}

const PRODUCTS = [
  {
    handle: 'nourishing-cleanser',
    title: 'Nourishing Cleanser',
    subtitle: 'Chamomile & Oat Extract',
    size: '150 ml',
    price: 32,
    productType: 'Face',
    tags: ['concern:glow', 'concern:calm', 'moment:am', 'moment:pm', 'scent:unscented', 'scent:clean', 'elora:face'],
    imageAsset: 'product-nourishing-cleanser.png',
    description:
      'A gentle cream cleanser that lifts the day without stripping. Chamomile and oat settle the skin so the rest of the ritual can land.',
  },
  {
    handle: 'daily-hydration-gel',
    title: 'Daily Hydration Gel',
    subtitle: 'Hyaluronic Acid + Aloe Vera',
    size: '50 ml',
    price: 48,
    productType: 'Face',
    tags: ['concern:hydrate', 'concern:barrier', 'moment:am', 'scent:unscented', 'elora:face'],
    imageAsset: 'product-daily-hydration-gel.png',
    description:
      'A lightweight gel moisturizer that delivers instant hydration and helps maintain a healthy, radiant complexion.',
    extraSizes: [{ size: '100 ml', price: 72 }],
  },
  {
    handle: 'glow-drops-serum',
    title: 'Glow Drops Serum',
    subtitle: 'Niacinamide + Kakadu Plum',
    size: '30 ml',
    price: 52,
    productType: 'Face',
    tags: ['concern:glow', 'moment:am', 'scent:unscented', 'scent:clean', 'elora:face'],
    imageAsset: 'product-glow-drops-serum.png',
    description:
      'A concentrated glow treatment with niacinamide and kakadu plum. Layer under moisturizer for a quiet, even radiance.',
  },
  {
    handle: 'airy-sun-fluid-spf-50',
    title: 'Airy Sun Fluid SPF 50',
    subtitle: 'Broad Spectrum UVA + UVB',
    size: '50 ml',
    price: 36,
    productType: 'Face',
    tags: ['concern:glow', 'moment:am', 'scent:unscented', 'scent:clean', 'elora:face'],
    imageAsset: 'product-airy-sun-fluid.png',
    description:
      'A weightless daily fluid with broad-spectrum UVA + UVB protection. The last step of a morning face ritual.',
  },
  {
    handle: 'restorative-night-cream',
    title: 'Restorative Night Cream',
    subtitle: 'Bakuchiol + Squalane',
    size: '50 ml',
    price: 58,
    productType: 'Face',
    tags: ['concern:barrier', 'concern:calm', 'moment:pm', 'scent:unscented', 'elora:face'],
    imageAsset: 'product-restorative-night-cream.png',
    description:
      'A cushioned night cream with bakuchiol and squalane. Restore the barrier while you sleep.',
  },
  {
    handle: 'balancing-toner',
    title: 'Balancing Toner',
    subtitle: 'Green Tea + Witch Hazel',
    size: '200 ml',
    price: 34,
    productType: 'Face',
    tags: ['concern:calm', 'moment:am', 'moment:pm', 'scent:unscented', 'elora:face'],
    imageAsset: 'product-balancing-toner.png',
    description:
      'A clarifying mist-toner with green tea and witch hazel. Reset the skin between cleanse and treat.',
  },
  {
    handle: 'body-lotion',
    title: 'Body Lotion',
    subtitle: 'Shea Butter + Niacinamide',
    size: '250 ml',
    price: 36,
    productType: 'Body',
    tags: ['concern:hydrate', 'moment:body', 'scent:warm', 'elora:body', 'wardrobe:warm-skin'],
    imageAsset: 'product-body-lotion.png',
    description:
      'A daily body lotion with shea butter and niacinamide. Seal in moisture after the shower.',
  },
  {
    handle: 'body-oil',
    title: 'Body Oil',
    subtitle: 'Jojoba + Camellia Oil',
    size: '100 ml',
    price: 42,
    productType: 'Body',
    tags: ['concern:glow', 'moment:body', 'scent:warm', 'elora:body', 'wardrobe:warm-skin'],
    imageAsset: 'product-body-oil.png',
    description:
      'A fast-absorbing body oil with jojoba and camellia. Warm skin, soft finish.',
  },
  {
    handle: 'eau-de-parfum',
    title: 'Eau de Parfum',
    subtitle: 'Warm Florals + Soft Woods',
    size: '50 ml',
    price: 72,
    productType: 'Fragrance',
    tags: ['concern:calm', 'moment:pm', 'moment:body', 'scent:floral', 'scent:warm', 'elora:body', 'elora:sets', 'wardrobe:soft-bloom'],
    imageAsset: 'product-eau-de-parfum.png',
    description:
      'A quiet signature of warm florals and soft woods. The scent that closes the ritual.',
  },
  {
    handle: 'soft-bloom',
    title: 'Soft Bloom',
    subtitle: 'Fertile Florals. Dewy & delicate.',
    size: '50 ml',
    price: 68,
    productType: 'Fragrance',
    tags: ['concern:calm', 'moment:pm', 'scent:floral', 'elora:scent', 'wardrobe:soft-bloom'],
    imageAsset: 'product-soft-bloom.png',
    description:
      'N°01 in the Elora Scent Wardrobe. A dewy floral that sits close to the skin — fertile bloom, never loud.',
  },
  {
    handle: 'warm-skin',
    title: 'Warm Skin',
    subtitle: 'Amber. Soft. Comforting.',
    size: '50 ml',
    price: 68,
    productType: 'Fragrance',
    tags: ['concern:hydrate', 'moment:body', 'scent:warm', 'elora:scent', 'elora:body', 'wardrobe:warm-skin'],
    imageAsset: 'product-warm-skin.png',
    description:
      'N°02 in the Elora Scent Wardrobe. Amber and skin-warm woods. The scent of a body ritual, after the shower.',
  },
  {
    handle: 'bare-linen',
    title: 'Bare Linen',
    subtitle: 'Clean. Crisp. Understated.',
    size: '50 ml',
    price: 68,
    productType: 'Fragrance',
    tags: ['concern:calm', 'moment:am', 'scent:clean', 'elora:scent', 'wardrobe:bare-linen'],
    imageAsset: 'product-bare-linen.png',
    description:
      'N°03 in the Elora Scent Wardrobe. Clean air and sun-dried cloth. A quiet morning scent, barely there.',
  },
]

function sizeLabel(size) {
  return SIZE_LABELS[size] || size
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function parseJsonPayload(stdout) {
  const start = stdout.indexOf('{')
  const end = stdout.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`No JSON payload in CLI output:\n${stdout}`)
  }
  return JSON.parse(stdout.slice(start, end + 1))
}

function execute({ queryFile, variables, mutate = false }) {
  const args = [
    'store',
    'execute',
    '--store',
    STORE,
    '--json',
    '--version',
    API_VERSION,
    '--query-file',
    queryFile,
  ]

  let variableFile
  if (variables) {
    variableFile = path.join(os.tmpdir(), `elora-vars-${Date.now()}-${Math.random().toString(16).slice(2)}.json`)
    fs.writeFileSync(variableFile, JSON.stringify(variables))
    args.push('--variable-file', variableFile)
  }
  if (mutate) args.push('--allow-mutations')

  const result = spawnSync('shopify', args, {
    encoding: 'utf8',
    shell: true,
    maxBuffer: 20_000_000,
    env: {
      ...process.env,
      SHOPIFY_CLI_AGENT_INFO: 'n:cursor-grok|v:1.0.0|p:cursor',
      SHOPIFY_CLI_AGENT_IDS: 's:elora-catalog|r:storefront-data|i:1',
    },
  })

  if (variableFile) {
    try {
      fs.unlinkSync(variableFile)
    } catch {
      /* ignore */
    }
  }

  const stdout = `${result.stdout || ''}`
  const stderr = `${result.stderr || ''}`
  if (result.status !== 0) {
    throw new Error(`shopify store execute failed (${result.status}):\n${stderr || stdout}`)
  }

  const payload = parseJsonPayload(stdout)
  if (payload.errors?.length) {
    throw new Error(payload.errors.map(error => error.message).join('; '))
  }
  return payload
}

async function stagedUpload(filename, mimeType, buffer) {
  const staged = execute({
    queryFile: path.join(GRAPHQL_DIR, 'staged-uploads.graphql'),
    mutate: true,
    variables: {
      input: [
        {
          filename,
          mimeType,
          httpMethod: 'POST',
          resource: 'PRODUCT_IMAGE',
        },
      ],
    },
  })

  const target = staged.stagedUploadsCreate?.stagedTargets?.[0]
  const errors = staged.stagedUploadsCreate?.userErrors ?? []
  if (errors.length) throw new Error(errors.map(error => error.message).join('; '))
  if (!target?.url || !target.resourceUrl) {
    throw new Error(`stagedUploadsCreate returned no target for ${filename}`)
  }

  const form = new FormData()
  for (const parameter of target.parameters ?? []) {
    form.append(parameter.name, parameter.value)
  }
  form.append('file', new Blob([buffer], { type: mimeType }), filename)

  const upload = await fetch(target.url, { method: 'POST', body: form })
  if (!upload.ok) {
    const body = await upload.text()
    throw new Error(`Staged upload failed for ${filename}: ${upload.status} ${body.slice(0, 400)}`)
  }

  return target.resourceUrl
}

function assertNoUserErrors(userErrors, label) {
  if (userErrors?.length) {
    throw new Error(`${label}: ${userErrors.map(error => error.message).join('; ')}`)
  }
}

function findProduct(handle) {
  const payload = execute({
    queryFile: path.join(GRAPHQL_DIR, 'find-product.graphql'),
    variables: { identifier: { handle } },
  })
  const product = payload.productByIdentifier
  if (!product?.id) return null
  return {
    productId: product.id,
    variantIds: (product.variants?.nodes ?? []).map(node => node.id),
  }
}

async function ensureProduct(product) {
  const existing = findProduct(product.handle)
  if (existing) {
    console.log(`exists ${product.handle} ${existing.productId}`)
    return existing
  }

  const imagePath = path.join(ASSETS_DIR, product.imageAsset)
  if (!fs.existsSync(imagePath)) {
    throw new Error(`Missing product still: ${imagePath}`)
  }
  const buffer = fs.readFileSync(imagePath)
  const resourceUrl = await stagedUpload(product.imageAsset, 'image/png', buffer)

  const sizeValues = [sizeLabel(product.size), ...(product.extraSizes ?? []).map(entry => sizeLabel(entry.size))]

  const created = execute({
    queryFile: path.join(GRAPHQL_DIR, 'create-product.graphql'),
    mutate: true,
    variables: {
      product: {
        title: product.title,
        handle: product.handle,
        vendor: 'Elora',
        productType: product.productType,
        status: 'ACTIVE',
        tags: product.tags,
        descriptionHtml: `<p>${escapeHtml(product.subtitle)}</p><p>${escapeHtml(product.description)}</p>`,
        productOptions: [{ name: 'Size', values: sizeValues.map(name => ({ name })) }],
        metafields: [
          {
            namespace: 'elora',
            key: 'subtitle',
            type: 'single_line_text_field',
            value: product.subtitle,
          },
        ],
      },
      media: [
        {
          originalSource: resourceUrl,
          alt: product.title,
          mediaContentType: 'IMAGE',
        },
      ],
    },
  })

  assertNoUserErrors(created.productCreate?.userErrors, `productCreate ${product.handle}`)
  const createdProduct = created.productCreate?.product
  if (!createdProduct?.id) {
    throw new Error(`productCreate returned no product for ${product.handle}`)
  }

  const firstVariantId = createdProduct.variants?.nodes?.[0]?.id
  if (firstVariantId) {
    const updated = execute({
      queryFile: path.join(GRAPHQL_DIR, 'variant-update.graphql'),
      mutate: true,
      variables: {
        productId: createdProduct.id,
        variants: [
          {
            id: firstVariantId,
            price: product.price.toFixed(2),
            inventoryPolicy: 'CONTINUE',
            inventoryItem: { tracked: false },
          },
        ],
      },
    })
    assertNoUserErrors(updated.productVariantsBulkUpdate?.userErrors, `variant update ${product.handle}`)
  }

  const extraVariants = []
  for (const extra of product.extraSizes ?? []) {
    extraVariants.push({
      optionValues: [{ optionName: 'Size', name: sizeLabel(extra.size) }],
      price: extra.price.toFixed(2),
      inventoryPolicy: 'CONTINUE',
      inventoryItem: { tracked: false },
    })
  }

  if (extraVariants.length) {
    const extra = execute({
      queryFile: path.join(GRAPHQL_DIR, 'variant-create.graphql'),
      mutate: true,
      variables: { productId: createdProduct.id, variants: extraVariants },
    })
    assertNoUserErrors(extra.productVariantsBulkCreate?.userErrors, `variant create ${product.handle}`)
  }

  const published = execute({
    queryFile: path.join(GRAPHQL_DIR, 'publish.graphql'),
    mutate: true,
    variables: {
      id: createdProduct.id,
      input: [{ publicationId: ONLINE_STORE_PUBLICATION }],
    },
  })
  assertNoUserErrors(published.publishablePublish?.userErrors, `publish ${product.handle}`)

  console.log(`created ${product.handle} ${createdProduct.id}`)
  return {
    productId: createdProduct.id,
    variantIds: (createdProduct.variants?.nodes ?? []).map(node => node.id),
  }
}

function listCollections() {
  const queryFile = path.join(os.tmpdir(), 'elora-list-collections.graphql')
  fs.writeFileSync(
    queryFile,
    `query {
      collections(first: 50) {
        nodes { id handle title }
      }
    }`,
  )
  const payload = execute({ queryFile })
  try {
    fs.unlinkSync(queryFile)
  } catch {
    /* ignore */
  }
  return payload.collections?.nodes ?? []
}

function ensureCollection({ handle, title, description, productIds }) {
  const existing = listCollections().find(collection => collection.handle === handle)
  if (existing) {
    if (productIds.length) {
      const added = execute({
        queryFile: path.join(GRAPHQL_DIR, 'collection-add.graphql'),
        mutate: true,
        variables: { id: existing.id, productIds },
      })
      const messages = (added.collectionAddProducts?.userErrors ?? [])
        .map(error => error.message)
        .filter(message => !/already/i.test(message))
      if (messages.length) throw new Error(`collectionAddProducts ${handle}: ${messages.join('; ')}`)
    }
    const published = execute({
      queryFile: path.join(GRAPHQL_DIR, 'publish.graphql'),
      mutate: true,
      variables: {
        id: existing.id,
        input: [{ publicationId: ONLINE_STORE_PUBLICATION }],
      },
    })
    assertNoUserErrors(published.publishablePublish?.userErrors, `publish collection ${handle}`)
    console.log(`exists collection ${handle} ${existing.id}`)
    return existing.id
  }

  const created = execute({
    queryFile: path.join(GRAPHQL_DIR, 'collection-create.graphql'),
    mutate: true,
    variables: {
      input: {
        title,
        handle,
        descriptionHtml: `<p>${escapeHtml(description)}</p>`,
        products: productIds,
      },
    },
  })
  assertNoUserErrors(created.collectionCreate?.userErrors, `collectionCreate ${handle}`)
  const collectionId = created.collectionCreate?.collection?.id
  if (!collectionId) throw new Error(`collectionCreate returned no collection for ${handle}`)

  const published = execute({
    queryFile: path.join(GRAPHQL_DIR, 'publish.graphql'),
    mutate: true,
    variables: {
      id: collectionId,
      input: [{ publicationId: ONLINE_STORE_PUBLICATION }],
    },
  })
  assertNoUserErrors(published.publishablePublish?.userErrors, `publish collection ${handle}`)
  console.log(`created collection ${handle} ${collectionId}`)
  return collectionId
}

async function main() {
  const created = []
  for (const product of PRODUCTS) {
    created.push({ ...product, ...(await ensureProduct(product)) })
  }

  const byHandle = new Map(created.map(entry => [entry.handle, entry.productId]))
  const allIds = created.map(entry => entry.productId)
  const faceIds = created.filter(entry => entry.productType === 'Face').map(entry => entry.productId)
  const bodyIds = created.filter(entry => entry.tags.includes('elora:body')).map(entry => entry.productId)
  const id = handle => byHandle.get(handle)
  const essentialIds = [
    'nourishing-cleanser',
    'daily-hydration-gel',
    'glow-drops-serum',
    'airy-sun-fluid-spf-50',
    'restorative-night-cream',
    'balancing-toner',
    'body-lotion',
    'body-oil',
    'eau-de-parfum',
  ]
    .map(id)
    .filter(Boolean)
  const scentWardrobeIds = ['soft-bloom', 'warm-skin', 'bare-linen', 'eau-de-parfum'].map(id).filter(Boolean)
  const softBloomIds = ['soft-bloom', 'eau-de-parfum'].map(id).filter(Boolean)
  const warmSkinIds = ['warm-skin', 'body-lotion', 'body-oil'].map(id).filter(Boolean)
  const bareLinenIds = ['bare-linen', 'nourishing-cleanser', 'glow-drops-serum', 'airy-sun-fluid-spf-50']
    .map(id)
    .filter(Boolean)

  ensureCollection({
    handle: 'skincare-essentials',
    title: 'Skincare Essentials',
    description: 'The full Elora ritual wardrobe for face, body, and scent.',
    productIds: essentialIds,
  })
  ensureCollection({
    handle: 'face',
    title: 'Face',
    description: 'Lightweight formulas for the morning and evening face ritual.',
    productIds: faceIds,
  })
  ensureCollection({
    handle: 'body',
    title: 'Body',
    description: 'After-shower care and a quiet signature scent.',
    productIds: bodyIds,
  })
  ensureCollection({
    handle: 'sets',
    title: 'Sets',
    description: 'Build a complete ritual. Pair cleanse, treat, and seal.',
    productIds: allIds,
  })
  ensureCollection({
    handle: 'scent-wardrobe',
    title: 'The Elora Scent Wardrobe',
    description: 'Three quiet signatures. Soft Bloom, Warm Skin, and Bare Linen.',
    productIds: scentWardrobeIds,
  })
  ensureCollection({
    handle: 'soft-bloom',
    title: 'Soft Bloom',
    description: 'N°01. Fertile florals. Dewy and delicate.',
    productIds: softBloomIds,
  })
  ensureCollection({
    handle: 'warm-skin',
    title: 'Warm Skin',
    description: 'N°02. Amber. Soft. Comforting.',
    productIds: warmSkinIds,
  })
  ensureCollection({
    handle: 'bare-linen',
    title: 'Bare Linen',
    description: 'N°03. Clean. Crisp. Understated.',
    productIds: bareLinenIds,
  })

  const frontpage = execute({
    queryFile: path.join(GRAPHQL_DIR, 'collection-add.graphql'),
    mutate: true,
    variables: { id: FRONTPAGE_COLLECTION, productIds: allIds },
  })
  const frontpageErrors = (frontpage.collectionAddProducts?.userErrors ?? [])
    .map(error => error.message)
    .filter(message => !/already/i.test(message))
  if (frontpageErrors.length) {
    throw new Error(`frontpage: ${frontpageErrors.join('; ')}`)
  }
  console.log(`updated frontpage with ${allIds.length} products`)
  console.log(`seeded ${created.length} products: ${[...byHandle.keys()].join(', ')}`)
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
