import { mysqlTable, varchar, mysqlEnum, int, decimal } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'
import { rituals } from './rituals'

export const ritualComponents = mysqlTable('ritual_components', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`(UUID())`),
  ritualId: varchar('ritual_id', { length: 36 }).notNull().references(() => rituals.id, { onDelete: 'cascade' }),
  shopifyProductId: varchar('shopify_product_id', { length: 100 }).notNull(),
  shopifyVariantId: varchar('shopify_variant_id', { length: 100 }),
  productTitleCache: varchar('product_title_cache', { length: 255 }),
  role: mysqlEnum('role', ['cleanse', 'treat', 'seal', 'scent']).notNull(),
  quantity: int('quantity').notNull().default(1),
  unitCost: decimal('unit_cost', { precision: 10, scale: 2 }),
  sortOrder: int('sort_order').notNull().default(0),
})
