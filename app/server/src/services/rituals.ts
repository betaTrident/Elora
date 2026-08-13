import { eq, and, asc } from 'drizzle-orm'
import { db } from '../db/client'
import { rituals, ritualComponents, shopSettings } from '../db/schema'
import type { ShopContext } from '../shopify/auth'
import { calculateHealthScore, type ComponentInput } from './scoring'
import { logActivity } from './activity'
import { upsertAlerts } from './alerts'
import { fetchInventory } from '../shopify/graphql'

export interface RitualComponent {
  shopifyProductId: string
  shopifyVariantId?: string | null
  productTitleCache?: string
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

function notFound(): void {
  throw Object.assign(new Error('Not found'), { status: 404 })
}

async function fetchInventorySafe(shop: ShopContext, productIds: string[]) {
  try {
    return await fetchInventory(shop, productIds)
  } catch (err) {
    console.error('fetchInventory failed:', err)
    return []
  }
}

function mapComponentRow(row: typeof ritualComponents.$inferSelect) {
  return {
    id: row.id,
    shopifyProductId: row.shopifyProductId,
    shopifyVariantId: row.shopifyVariantId,
    productTitleCache: row.productTitleCache,
    role: row.role,
    quantity: row.quantity,
    unitCost: row.unitCost != null ? Number(row.unitCost) : undefined,
    sortOrder: row.sortOrder,
  }
}

function buildComponentRows(ritualId: string, components: RitualComponent[]) {
  return components.map((c, i) => ({
    id: crypto.randomUUID(),
    ritualId,
    shopifyProductId: c.shopifyProductId,
    shopifyVariantId: c.shopifyVariantId ?? null,
    productTitleCache: c.productTitleCache ?? null,
    role: c.role,
    quantity: c.quantity,
    unitCost: c.unitCost != null ? String(c.unitCost) : null,
    sortOrder: c.sortOrder ?? i,
  }))
}

function toScoreComponents(
  rows: Array<{
    role: RitualComponent['role']
    shopifyProductId: string
    shopifyVariantId?: string | null
    unitCost?: string | number | null
  }>,
): ComponentInput[] {
  return rows.map(row => ({
    role: row.role,
    shopifyProductId: row.shopifyProductId,
    shopifyVariantId: row.shopifyVariantId,
    unitCost: row.unitCost != null ? Number(row.unitCost) : null,
  }))
}

type DbExecutor = Pick<typeof db, 'insert' | 'update' | 'delete'>

async function scoreRitual(
  tx: DbExecutor,
  shop: ShopContext,
  ritualId: string,
  componentRows: ReturnType<typeof buildComponentRows>,
  productIds: string[],
) {
  const inventory = await fetchInventorySafe(shop, productIds)
  const { score, breakdown } = calculateHealthScore(toScoreComponents(componentRows), inventory)
  await tx
    .update(rituals)
    .set({ lastScore: score, lastScoredAt: new Date() })
    .where(eq(rituals.id, ritualId))
  return { score, breakdown }
}

export async function listRituals(shopId: string, status?: string) {
  const filterStatus = (status ?? 'active') as 'active' | 'archived'
  const rows = await db
    .select()
    .from(rituals)
    .where(and(eq(rituals.shopId, shopId), eq(rituals.status, filterStatus)))

  return rows.map(r => ({
    id: r.id,
    title: r.title,
    lastScore: r.lastScore,
    scoreThreshold: r.scoreThreshold,
    lastScoredAt: r.lastScoredAt,
    status: r.status,
    description: r.description,
  }))
}

export async function getRitual(shopId: string, id: string) {
  const [ritual] = await db
    .select()
    .from(rituals)
    .where(and(eq(rituals.shopId, shopId), eq(rituals.id, id)))
    .limit(1)

  if (!ritual) {
    notFound()
  }

  const components = await db
    .select()
    .from(ritualComponents)
    .where(eq(ritualComponents.ritualId, id))
    .orderBy(asc(ritualComponents.sortOrder))

  return {
    id: ritual.id,
    title: ritual.title,
    description: ritual.description,
    lastScore: ritual.lastScore,
    scoreThreshold: ritual.scoreThreshold,
    lastScoredAt: ritual.lastScoredAt,
    status: ritual.status,
    components: components.map(mapComponentRow),
  }
}

export async function createRitual(shop: ShopContext, input: CreateRitualBody) {
  const [settings] = await db
    .select()
    .from(shopSettings)
    .where(eq(shopSettings.shopId, shop.shopId))
    .limit(1)
  const threshold = input.scoreThreshold ?? settings?.defaultThreshold ?? 70

  const result = await db.transaction(async tx => {
    const id = crypto.randomUUID()
    await tx.insert(rituals).values({
      id,
      shopId: shop.shopId,
      title: input.title,
      description: input.description ?? null,
      scoreThreshold: threshold,
    })

    const componentRows = buildComponentRows(id, input.components)
    await tx.insert(ritualComponents).values(componentRows)

    const productIds = input.components.map(c => c.shopifyProductId)
    const { score, breakdown } = await scoreRitual(tx, shop, id, componentRows, productIds)

    await logActivity(tx, {
      shopId: shop.shopId,
      actorType: 'merchant',
      actorId: shop.userId ?? undefined,
      action: 'ritual.created',
      entityType: 'ritual',
      entityId: id,
      summary: `Created routine "${input.title}"`,
      afterJson: { score, threshold },
    })

    return { id, score, breakdown, threshold }
  })

  await upsertAlerts(shop.shopId, result.id, result.score, result.threshold, result.breakdown)
  return result
}

export async function updateRitual(shop: ShopContext, id: string, input: CreateRitualBody) {
  const [existing] = await db
    .select()
    .from(rituals)
    .where(and(eq(rituals.shopId, shop.shopId), eq(rituals.id, id)))
    .limit(1)

  if (!existing) {
    notFound()
  }

  const threshold = input.scoreThreshold ?? existing.scoreThreshold

  const result = await db.transaction(async tx => {
    await tx
      .update(rituals)
      .set({
        title: input.title,
        description: input.description ?? null,
        scoreThreshold: threshold,
      })
      .where(eq(rituals.id, id))

    await tx.delete(ritualComponents).where(eq(ritualComponents.ritualId, id))

    const componentRows = buildComponentRows(id, input.components)
    await tx.insert(ritualComponents).values(componentRows)

    const productIds = input.components.map(c => c.shopifyProductId)
    const { score, breakdown } = await scoreRitual(tx, shop, id, componentRows, productIds)

    await logActivity(tx, {
      shopId: shop.shopId,
      actorType: 'merchant',
      actorId: shop.userId ?? undefined,
      action: 'ritual.updated',
      entityType: 'ritual',
      entityId: id,
      summary: `Updated routine "${input.title}"`,
      afterJson: { score, threshold },
    })

    return { id, score, breakdown, threshold }
  })

  await upsertAlerts(shop.shopId, result.id, result.score, result.threshold, result.breakdown)
  return result
}

export async function archiveRitual(shop: ShopContext, id: string) {
  const [existing] = await db
    .select()
    .from(rituals)
    .where(and(eq(rituals.shopId, shop.shopId), eq(rituals.id, id)))
    .limit(1)

  if (!existing) {
    notFound()
  }

  await db
    .update(rituals)
    .set({ status: 'archived' })
    .where(and(eq(rituals.shopId, shop.shopId), eq(rituals.id, id)))

  await logActivity(db, {
    shopId: shop.shopId,
    actorType: 'merchant',
    actorId: shop.userId ?? undefined,
    action: 'ritual.archived',
    entityType: 'ritual',
    entityId: id,
    summary: `Archived routine "${existing.title}"`,
  })
}

export async function recalculateRitual(shop: ShopContext, id: string) {
  const [ritual] = await db
    .select()
    .from(rituals)
    .where(and(eq(rituals.shopId, shop.shopId), eq(rituals.id, id)))
    .limit(1)

  if (!ritual) {
    notFound()
  }

  const components = await db
    .select()
    .from(ritualComponents)
    .where(eq(ritualComponents.ritualId, id))
    .orderBy(asc(ritualComponents.sortOrder))

  const productIds = components.map(c => c.shopifyProductId)
  const inventory = await fetchInventorySafe(shop, productIds)
  const { score, breakdown } = calculateHealthScore(toScoreComponents(components), inventory)

  await db
    .update(rituals)
    .set({ lastScore: score, lastScoredAt: new Date() })
    .where(and(eq(rituals.id, id), eq(rituals.shopId, shop.shopId)))

  await logActivity(db, {
    shopId: shop.shopId,
    actorType: 'merchant',
    actorId: shop.userId ?? undefined,
    action: 'ritual.recalculated',
    entityType: 'ritual',
    entityId: id,
    summary: `Recalculated routine "${ritual.title}"`,
    afterJson: { score },
  })

  await upsertAlerts(shop.shopId, id, score, ritual.scoreThreshold ?? 70, breakdown)

  return { score, breakdown }
}

export async function recalculateAllRituals(shop: ShopContext): Promise<{ recalculated: number }> {
  const active = await listRituals(shop.shopId, 'active')
  for (const ritual of active) {
    await recalculateRitual(shop, ritual.id)
  }
  return { recalculated: active.length }
}
