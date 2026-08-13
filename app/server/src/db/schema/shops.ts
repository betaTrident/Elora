import { mysqlTable, varchar, datetime, text } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'

export const shops = mysqlTable('shops', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`(UUID())`),
  shopDomain: varchar('shop_domain', { length: 255 }).notNull().unique(),
  accessToken: text('access_token').notNull(),
  scope: varchar('scope', { length: 500 }),
  installedAt: datetime('installed_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  uninstalledAt: datetime('uninstalled_at'),
})
