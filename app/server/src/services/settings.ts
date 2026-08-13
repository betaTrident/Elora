import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { shopSettings } from '../db/schema'
import type { ShopContext } from '../shopify/auth'
import { logActivity } from './activity'

export async function getSettings(shopId: string): Promise<{ defaultThreshold: number }> {
  const [row] = await db
    .select()
    .from(shopSettings)
    .where(eq(shopSettings.shopId, shopId))
    .limit(1)

  return { defaultThreshold: row?.defaultThreshold ?? 70 }
}

export async function updateSettings(
  shop: ShopContext,
  defaultThreshold: number,
): Promise<{ defaultThreshold: number }> {
  await db
    .insert(shopSettings)
    .values({ shopId: shop.shopId, defaultThreshold })
    .onDuplicateKeyUpdate({ set: { defaultThreshold } })

  await logActivity(db, {
    shopId: shop.shopId,
    actorType: 'merchant',
    actorId: shop.userId ?? undefined,
    action: 'settings.updated',
    entityType: 'shop_settings',
    summary: `Default threshold set to ${defaultThreshold}`,
    afterJson: { defaultThreshold },
  })

  return { defaultThreshold }
}
