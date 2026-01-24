import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

export const gameLibrary = sqliteTable('game_library', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title'),
  normalizedTitle: text('normalized_title').notNull(),
  genre: text('genre'),
  stores: text('stores'),
  pricePaid: real('price_paid'),
  duplicate: integer('duplicate'),
});
