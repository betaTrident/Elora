import { mysqlTable, varchar, text, mysqlEnum, datetime } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'
import { shops } from './shops'
import { rituals } from './rituals'

export const alerts = mysqlTable('alerts', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`(UUID())`),
  shopId: varchar('shop_id', { length: 36 }).notNull().references(() => shops.id),
  ritualId: varchar('ritual_id', { length: 36 }).notNull().references(() => rituals.id),
  type: mysqlEnum('type', ['low_score', 'component_unavailable']).notNull(),
  severity: mysqlEnum('severity', ['warning', 'critical']).notNull().default('warning'),
  message: text('message').notNull(),
  status: mysqlEnum('status', ['open', 'resolved']).notNull().default('open'),
  createdAt: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  resolvedAt: datetime('resolved_at'),
})
