import { mysqlTable, varchar, int } from 'drizzle-orm/mysql-core'
import { shops } from './shops'

export const shopSettings = mysqlTable('shop_settings', {
  shopId: varchar('shop_id', { length: 36 }).primaryKey().references(() => shops.id),
  defaultThreshold: int('default_threshold').notNull().default(70),
})
