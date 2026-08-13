import jwt from 'jsonwebtoken'
import { eq } from 'drizzle-orm'
import { config } from '../config'
import { db } from '../db/client'
import { shops, shopSettings } from '../db/schema'

export interface ShopContext {
  shopDomain: string
  shopId: string
  userId: string | null
}

function parseShopDomain(dest: string): string {
  return dest.includes('://') ? new URL(dest).hostname : dest
}

export async function verifySessionToken(token: string): Promise<ShopContext> {
  const payload = jwt.verify(token, config.shopifyApiSecret, {
    algorithms: ['HS256'],
    audience: config.shopifyApiKey,
  }) as Record<string, unknown>

  const dest = payload.dest as string
  const shopDomain = parseShopDomain(dest)

  const [shop] = await db
    .select({ id: shops.id })
    .from(shops)
    .where(eq(shops.shopDomain, shopDomain))
    .limit(1)

  if (!shop) {
    const { shopId } = await exchangeAndUpsertShop(shopDomain, token)
    return { shopDomain, shopId, userId: (payload.sub as string) ?? null }
  }

  return { shopDomain, shopId: shop.id, userId: (payload.sub as string) ?? null }
}

async function exchangeAndUpsertShop(shopDomain: string, sessionToken: string) {
  const res = await fetch(`https://${shopDomain}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: config.shopifyApiKey,
      client_secret: config.shopifyApiSecret,
      grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
      subject_token: sessionToken,
      subject_token_type: 'urn:ietf:params:oauth:token-type:id_token',
      requested_token_type: 'urn:shopify:params:oauth:token-type:offline-access-token',
    }),
  })
  if (!res.ok) throw new Error('Token exchange failed')
  const { access_token } = (await res.json()) as { access_token: string }

  await db
    .insert(shops)
    .values({ shopDomain, accessToken: access_token, scope: 'read_products,read_inventory,write_products' })
    .onDuplicateKeyUpdate({
      set: { accessToken: access_token, uninstalledAt: null, scope: 'read_products,read_inventory,write_products' },
    })

  const [shop] = await db
    .select({ id: shops.id })
    .from(shops)
    .where(eq(shops.shopDomain, shopDomain))
    .limit(1)

  if (!shop) {
    throw new Error(`Shop not found after upsert: ${shopDomain}`)
  }

  await db
    .insert(shopSettings)
    .values({ shopId: shop.id })
    .onDuplicateKeyUpdate({ set: { shopId: shop.id } })
  return { shopId: shop.id }
}
