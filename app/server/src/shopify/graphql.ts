import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { shops } from '../db/schema'
import type { ShopContext } from './auth'
import type { InventoryInfo } from '../services/scoring'
import type { EloraProduct } from '../db/elora-catalog'

const API_VERSION = '2025-01'

const INVENTORY_QUERY = `
  query FetchProductInventory($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product {
        id
        status
        variants(first: 1) {
          nodes {
            id
            price
            inventoryQuantity
          }
        }
      }
    }
  }
`

const PRODUCT_BY_HANDLE_QUERY = `
  query FindProductByHandle($identifier: ProductIdentifierInput!) {
    productByIdentifier(identifier: $identifier) {
      id
      variants(first: 1) {
        nodes { id }
      }
    }
  }
`

const PRODUCT_CREATE_MUTATION = `
  mutation CreateCatalogProduct($product: ProductCreateInput!) {
    productCreate(product: $product) {
      product {
        id
        variants(first: 1) {
          nodes { id }
        }
      }
      userErrors { field message }
    }
  }
`

const VARIANT_PRICE_MUTATION = `
  mutation SetVariantPrice($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkUpdate(productId: $productId, variants: $variants) {
      productVariants { id }
      userErrors { field message }
    }
  }
`

interface GraphQLError {
  message: string
  extensions?: { code?: string }
}

interface GraphQLResponse<T> {
  data?: T
  errors?: GraphQLError[]
}

interface ProductNode {
  id: string
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED'
  variants?: {
    nodes: Array<{
      id: string
      price: string
      inventoryQuantity: number | null
    }>
  }
}

/** Shopify returns null when inventory is untracked; untracked is sellable. 0 remains OOS. */
export function availableFromInventoryQuantity(quantity: number | null | undefined): number {
  if (quantity === null) return 1
  return quantity ?? 0
}

export interface CatalogProductIds {
  productId: string
  variantId: string | null
}

export class ShopifyGraphqlAccessDeniedError extends Error {
  constructor(message = 'write_products is required (reinstall app)') {
    super(message)
    this.name = 'ShopifyGraphqlAccessDeniedError'
  }
}

function isAccessDenied(errors?: GraphQLError[]): boolean {
  return Boolean(
    errors?.some(
      error => error.extensions?.code === 'ACCESS_DENIED' || /access denied/i.test(error.message),
    ),
  )
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

async function shopifyGraphql<T>(
  shopDomain: string,
  accessToken: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<GraphQLResponse<T>> {
  const res = await fetch(`https://${shopDomain}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({ query, variables }),
  })

  if (res.status === 401 || res.status === 403) {
    throw new ShopifyGraphqlAccessDeniedError()
  }

  if (!res.ok) {
    throw new Error(`GraphQL request failed: ${res.status}`)
  }

  return (await res.json()) as GraphQLResponse<T>
}

function assertGraphqlOk(errors?: GraphQLError[]): void {
  if (isAccessDenied(errors)) {
    throw new ShopifyGraphqlAccessDeniedError()
  }
  if (errors?.length) {
    throw new Error(errors.map(error => error.message).join('; '))
  }
}

export async function fetchInventory(shop: ShopContext, productIds: string[]): Promise<InventoryInfo[]> {
  if (productIds.length === 0) {
    return []
  }

  const [shopRow] = await db
    .select({ accessToken: shops.accessToken })
    .from(shops)
    .where(eq(shops.id, shop.shopId))
    .limit(1)

  if (!shopRow) {
    throw new Error(`Shop not found: ${shop.shopId}`)
  }

  const body = await shopifyGraphql<{ nodes: Array<ProductNode | null> }>(
    shop.shopDomain,
    shopRow.accessToken,
    INVENTORY_QUERY,
    { ids: productIds },
  )
  assertGraphqlOk(body.errors)

  const results: InventoryInfo[] = []
  for (const node of body.data?.nodes ?? []) {
    if (!node?.id) continue
    const variant = node.variants?.nodes?.[0]
    results.push({
      productId: node.id,
      variantId: variant?.id,
      available: availableFromInventoryQuantity(variant?.inventoryQuantity),
      status: node.status,
      price: variant?.price ?? '0',
    })
  }

  return results
}

export async function findProductByHandle(
  shopDomain: string,
  accessToken: string,
  handle: string,
): Promise<CatalogProductIds | null> {
  const body = await shopifyGraphql<{
    productByIdentifier: { id: string; variants?: { nodes: Array<{ id: string }> } } | null
  }>(shopDomain, accessToken, PRODUCT_BY_HANDLE_QUERY, { identifier: { handle } })
  assertGraphqlOk(body.errors)

  const product = body.data?.productByIdentifier
  if (!product?.id) return null
  return {
    productId: product.id,
    variantId: product.variants?.nodes?.[0]?.id ?? null,
  }
}

async function setVariantPrice(
  shopDomain: string,
  accessToken: string,
  productId: string,
  variantId: string,
  price: number,
): Promise<void> {
  const body = await shopifyGraphql<{
    productVariantsBulkUpdate: { userErrors: Array<{ message: string }> }
  }>(shopDomain, accessToken, VARIANT_PRICE_MUTATION, {
    productId,
    variants: [{ id: variantId, price: price.toFixed(2) }],
  })
  assertGraphqlOk(body.errors)
  const userErrors = body.data?.productVariantsBulkUpdate.userErrors ?? []
  if (userErrors.length) {
    throw new Error(userErrors.map(error => error.message).join('; '))
  }
}

export async function createCatalogProduct(
  shopDomain: string,
  accessToken: string,
  product: Pick<EloraProduct, 'handle' | 'title' | 'subtitle' | 'size' | 'price' | 'tags' | 'vendor'>,
): Promise<CatalogProductIds> {
  const body = await shopifyGraphql<{
    productCreate: {
      product: { id: string; variants?: { nodes: Array<{ id: string }> } } | null
      userErrors: Array<{ message: string }>
    }
  }>(shopDomain, accessToken, PRODUCT_CREATE_MUTATION, {
    product: {
      title: product.title,
      handle: product.handle,
      vendor: product.vendor,
      status: 'ACTIVE',
      tags: product.tags,
      descriptionHtml: `<p>${escapeHtml(product.subtitle)} · ${escapeHtml(product.size)}</p>`,
    },
  })
  assertGraphqlOk(body.errors)

  const payload = body.data?.productCreate
  const userErrors = payload?.userErrors ?? []
  if (userErrors.length) {
    throw new Error(userErrors.map(error => error.message).join('; '))
  }

  const created = payload?.product
  if (!created?.id) {
    throw new Error(`productCreate returned no product for handle ${product.handle}`)
  }

  const variantId = created.variants?.nodes?.[0]?.id ?? null
  if (variantId) {
    await setVariantPrice(shopDomain, accessToken, created.id, variantId, product.price)
  }

  return { productId: created.id, variantId }
}
