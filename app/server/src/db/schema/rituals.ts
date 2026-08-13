import { mysqlTable, varchar, text, mysqlEnum, int, datetime } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'
import { shops } from './shops'

export const rituals = mysqlTable('rituals', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`(UUID())`),
  shopId: varchar('shop_id', { length: 36 }).notNull().references(() => shops.id),
  title: varchar('title', { length: 120 }).notNull(),
  description: text('description'),
  status: mysqlEnum('status', ['active', 'archived']).notNull().default('active'),
  scoreThreshold: int('score_threshold').notNull().default(70),
  lastScore: int('last_score'),
  lastScoredAt: datetime('last_scored_at'),
  createdAt: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at').notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
})
