import { mysqlTable, varchar, int, json, datetime } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'
import { rituals } from './rituals'

export const scoreSnapshots = mysqlTable('score_snapshots', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`(UUID())`),
  ritualId: varchar('ritual_id', { length: 36 }).notNull().references(() => rituals.id),
  score: int('score').notNull(),
  breakdownJson: json('breakdown_json').notNull(),
  computedAt: datetime('computed_at').notNull().default(sql`CURRENT_TIMESTAMP`),
})
