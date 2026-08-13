import { mysqlTable, varchar, boolean, datetime, text } from 'drizzle-orm/mysql-core'

export const sessions = mysqlTable('sessions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  shop: varchar('shop', { length: 255 }).notNull(),
  state: varchar('state', { length: 255 }),
  isOnline: boolean('is_online').notNull().default(false),
  scope: varchar('scope', { length: 500 }),
  expires: datetime('expires'),
  accessToken: text('access_token'),
  userId: varchar('user_id', { length: 255 }),
})
