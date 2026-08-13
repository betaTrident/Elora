import { and, desc, eq } from 'drizzle-orm'
import { db } from '../db/client'
import { activityLogs } from '../db/schema'

type DbExecutor = Pick<typeof db, 'insert'>

interface ActivityInput {
  shopId: string
  actorType: 'merchant' | 'system'
  actorId?: string
  action: string
  entityType: string
  entityId?: string
  summary: string
  beforeJson?: unknown
  afterJson?: unknown
}

export interface ActivityFilters {
  action?: string
  entityType?: string
  actorType?: string
  limit?: number
}

function present(value?: string): string | undefined {
  return value ? value : undefined
}

export async function logActivity(tx: DbExecutor, input: ActivityInput) {
  await tx.insert(activityLogs).values({
    id: crypto.randomUUID(),
    ...input,
    beforeJson: input.beforeJson ?? null,
    afterJson: input.afterJson ?? null,
  })
}

export async function listActivity(shopId: string, filters?: ActivityFilters) {
  const action = present(filters?.action)
  const entityType = present(filters?.entityType)
  const actorType = present(filters?.actorType)
  const cap = Math.min(filters?.limit ?? 100, 100)

  const conditions = [eq(activityLogs.shopId, shopId)]
  if (action) conditions.push(eq(activityLogs.action, action))
  if (entityType) conditions.push(eq(activityLogs.entityType, entityType))
  if (actorType) {
    conditions.push(eq(activityLogs.actorType, actorType as 'merchant' | 'system'))
  }

  return db
    .select()
    .from(activityLogs)
    .where(and(...conditions))
    .orderBy(desc(activityLogs.createdAt))
    .limit(cap)
}
