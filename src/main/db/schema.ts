import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const games = sqliteTable('games', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  normalizedTitle: text('normalized_title').notNull().unique(), // The link key
  title: text('title').notNull(),
  slug: text('slug'),
  category: text('category'),
  releaseDate: text('release_date'),
});

export const store_entries = sqliteTable('store_entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  gameId: integer('game_id').references(() => games.id), // Foreign Key
  storeName: text('store_name').notNull(), // "GOG", "Steam"
  storeSpecificId: text('store_specific_id').notNull(),
  osSupported: text('os_supported').$type<Record<string, boolean>>().$onUpdateFn((val) => {
    if (!val) return val;
    // Automatically lowercase all keys whenever this column is updated
    return Object.keys(val).reduce((acc, key) => {
      acc[key.toLowerCase()] = val[key];
      return acc;
    }, {});
  }),
});
