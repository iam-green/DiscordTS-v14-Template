import { pgTable, uuid, timestamp } from 'drizzle-orm/pg-core';

export const example = pgTable('example', {
  id: uuid('id').primaryKey().defaultRandom(),
  created: timestamp('created').notNull().defaultNow(),
});
