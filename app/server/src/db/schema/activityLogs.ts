import { mysqlTable, varchar, mysqlEnum, text, json, datetime } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'
import { shops } from './shops'

export const activityLogs = mysqlTable('activity_logs', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`(UUID())`),
  shopId: varchar('shop_id', { length: 36 }).notNull().references(() => shops.id),
  actorType: mysqlEnum('actor_type', ['merchant', 'system']).notNull().default('merchant'),
  actorId: varchar('actor_id', { length: 255 }),
  action: varchar('action', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: varchar('entity_id', { length: 36 }),
  summary: text('summary').notNull(),
  beforeJson: json('before_json'),
  afterJson: json('after_json'),
  createdAt: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
})
