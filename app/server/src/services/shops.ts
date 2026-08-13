import { eq, sql } from 'drizzle-orm'
import { db } from '../db/client'
import { shops } from '../db/schema'

export async function softDeleteShop(shopDomain: string): Promise<void> {
  await db
    .update(shops)
    .set({
      uninstalledAt: sql`CURRENT_TIMESTAMP`,
      accessToken: '',
    })
    .where(eq(shops.shopDomain, shopDomain))
}
