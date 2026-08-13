import { and, desc, eq } from 'drizzle-orm'
import { db } from '../db/client'
import { alerts } from '../db/schema'
import type { ScoreBreakdown } from './scoring'
import { logActivity } from './activity'

type AlertType = 'low_score' | 'component_unavailable'
type AlertSeverity = 'warning' | 'critical'

interface AlertIssue {
  type: AlertType
  message: string
  severity: AlertSeverity
}

function notFound(): never {
  throw Object.assign(new Error('Not found'), { status: 404 })
}

function collectIssues(
  score: number,
  threshold: number,
  breakdown: ScoreBreakdown,
): AlertIssue[] {
  const issues: AlertIssue[] = []

  if (score < threshold) {
    issues.push({
      type: 'low_score',
      message: `Routine score ${score} is below threshold ${threshold}`,
      severity: score < threshold * 0.5 ? 'critical' : 'warning',
    })
  }

  const unavailable = breakdown.factors.filter(f => !f.available)
  unavailable.forEach(f => {
    issues.push({
      type: 'component_unavailable',
      message: `Product ${f.productId}: ${f.reason}`,
      severity: 'critical',
    })
  })

  return issues
}

function uniqueByType(issues: AlertIssue[]): AlertIssue[] {
  const seen = new Set<AlertType>()
  const unique: AlertIssue[] = []
  for (const issue of issues) {
    if (seen.has(issue.type)) continue
    seen.add(issue.type)
    unique.push(issue)
  }
  return unique
}

export async function upsertAlerts(
  shopId: string,
  ritualId: string,
  score: number,
  threshold: number,
  breakdown: ScoreBreakdown,
): Promise<void> {
  const issues = uniqueByType(collectIssues(score, threshold, breakdown))

  const existing = await db
    .select()
    .from(alerts)
    .where(and(eq(alerts.shopId, shopId), eq(alerts.ritualId, ritualId), eq(alerts.status, 'open')))

  for (const existingAlert of existing) {
    const stillNeeded = issues.some(i => i.type === existingAlert.type)
    if (!stillNeeded) {
      await db
        .update(alerts)
        .set({ status: 'resolved', resolvedAt: new Date() })
        .where(eq(alerts.id, existingAlert.id))
      await logActivity(db, {
        shopId,
        actorType: 'system',
        action: 'alert.resolved',
        entityType: 'alert',
        entityId: existingAlert.id,
        summary: `Alert resolved: ${existingAlert.message}`,
      })
    }
  }

  for (const issue of issues) {
    const alreadyOpen = existing.find(a => a.type === issue.type && a.status === 'open')
    if (!alreadyOpen) {
      const id = crypto.randomUUID()
      await db.insert(alerts).values({ id, shopId, ritualId, ...issue })
      await logActivity(db, {
        shopId,
        actorType: 'system',
        action: 'alert.opened',
        entityType: 'alert',
        entityId: id,
        summary: issue.message,
      })
    }
  }
}

export async function listOpenAlerts(shopId: string) {
  return db
    .select({
      id: alerts.id,
      ritualId: alerts.ritualId,
      type: alerts.type,
      severity: alerts.severity,
      message: alerts.message,
      status: alerts.status,
      createdAt: alerts.createdAt,
    })
    .from(alerts)
    .where(and(eq(alerts.shopId, shopId), eq(alerts.status, 'open')))
    .orderBy(desc(alerts.createdAt))
}

export async function resolveAlert(shopId: string, id: string) {
  const [existing] = await db
    .select()
    .from(alerts)
    .where(and(eq(alerts.shopId, shopId), eq(alerts.id, id)))
    .limit(1)

  if (!existing) {
    notFound()
  }

  await db
    .update(alerts)
    .set({ status: 'resolved', resolvedAt: new Date() })
    .where(and(eq(alerts.id, id), eq(alerts.shopId, shopId)))
}
