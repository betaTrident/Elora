import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { shops } from '../db/schema'
import type { ShopContext } from './auth'
import type { InventoryInfo } from '../services/scoring'

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

interface ProductNode {
  id: string
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED'
  variants?: {
    nodes: Array<{
      id: string
      price: string
      inventoryQuantity: number
    }>
  }
}

interface GraphQLResponse {
  data?: {
    nodes: Array<ProductNode | null>
  }
  errors?: Array<{ message: string }>
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

  const res = await fetch(`https://${shop.shopDomain}/admin/api/2025-01/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': shopRow.accessToken,
    },
    body: JSON.stringify({
      query: INVENTORY_QUERY,
      variables: { ids: productIds },
    }),
  })

  if (!res.ok) {
    throw new Error(`GraphQL request failed: ${res.status}`)
  }

  const body = (await res.json()) as GraphQLResponse
  if (body.errors?.length) {
    throw new Error(body.errors.map(e => e.message).join('; '))
  }

  const nodes = body.data?.nodes ?? []
  const results: InventoryInfo[] = []

  for (const node of nodes) {
    if (!node?.id) continue
    const variant = node.variants?.nodes?.[0]
    results.push({
      productId: node.id,
      variantId: variant?.id,
      available: variant?.inventoryQuantity ?? 0,
      status: node.status,
      price: variant?.price ?? '0',
    })
  }

  return results
}
