import { eq, and, count, desc } from 'drizzle-orm'
import { db } from '../db/client'
import { rituals, alerts, activityLogs } from '../db/schema'

export async function getDashboardData(shopId: string) {
  const allRituals = await db.select().from(rituals).where(
    and(eq(rituals.shopId, shopId), eq(rituals.status, 'active'))
  )
  const openAlerts = await db.select({ count: count() }).from(alerts).where(
    and(eq(alerts.shopId, shopId), eq(alerts.status, 'open'))
  )
  const recentActivity = await db.select().from(activityLogs)
    .where(eq(activityLogs.shopId, shopId))
    .orderBy(desc(activityLogs.createdAt))
    .limit(5)

  const healthy = allRituals.filter(r => r.lastScore !== null && r.lastScore >= r.scoreThreshold).length
  const broken = allRituals.filter(r => r.lastScore !== null && r.lastScore < r.scoreThreshold).length
  const unscored = allRituals.filter(r => r.lastScore === null).length
  const worst5 = allRituals
    .filter(r => r.lastScore !== null)
    .sort((a, b) => (a.lastScore ?? 0) - (b.lastScore ?? 0))
    .slice(0, 5)

  return {
    counts: { total: allRituals.length, healthy, broken, unscored, openAlerts: openAlerts[0]?.count ?? 0 },
    worst5,
    recentActivity,
  }
}
