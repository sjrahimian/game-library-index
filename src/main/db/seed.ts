
import { eq } from 'drizzle-orm';
import { gameLibrary } from './schema';
import { db } from './client';

export function normalizeTitle(title: string) {
  if (!title) return "";
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
}


// --- Seed initial games ---
export async function seedGames() {
  const initialGames = [
    {
      title: 'Hades ',
      genre: 'Roguelike',
      stores: ['Steam'],
      gameStoreId: 12345,
    },
    {
      title: 'Cyberpunk 2077',
      genre: 'RPG',
      stores: ['Steam', 'GOG'],
      gameStoreId: 12346,
    },
    {
      title: 'The Witcher 3: The Wild Hunt',
      genre: 'RPG',
      stores: ['GOG'],
      gameStoreId: 12347,
    },
    {
      title: 'The Witcher 3 - The Wild Hunt',
      genre: 'RPG',
      stores: ['Steam'],
      gameStoreId: 12348,
    },
  ];

  for (const game of initialGames) {
    const exists = await db
      .select()
      .from(gameLibrary)
      .where(eq(gameLibrary.normalizedTitle, normalizeTitle(game.title)))
      .all();

    if (exists.length === 0) {
      await db.insert(gameLibrary).values({
        ...game,
        normalizedTitle: normalizeTitle(game.title),
        stores: JSON.stringify(game.stores.sort()),
        duplicate: (game.stores.length < 2) ? 0 : 1,
      });
      console.log(`>>>> Added ${game.title} into database`);
    } else {
      
      const oldStores = JSON.parse(exists[0].stores) as string[];
      const newStores = Array.from(new Set([...oldStores, ...game.stores]));
      
      await db.update(gameLibrary).set({
        stores: JSON.stringify(newStores.sort()),
        duplicate: 1, // mark as duplicate
      }).where(eq(gameLibrary.id, exists[0].id));

      console.log(`>>>> Updated ${game.title} `);
    }
  }
}
