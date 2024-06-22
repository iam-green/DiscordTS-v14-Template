import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const guild = pgTable('guild', {
  id: text('id').primaryKey(),
  created: timestamp('created').notNull(),
});
