import { eq } from 'drizzle-orm';

// Local libraries
import { db } from '../db/client';
import { gameLibrary } from '../db/schema';

// --- Normalize title ---
export function normalizeTitle(title: string) {
  if (!title) return "";
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
}

// --- Upsert into database ---
export async function upsertGame(game: GameInsert) {
  const normalized = normalizeTitle(game.title);
  
  const existing = await db
  .select()
  .from(gameLibrary)
  .where(eq(gameLibrary.normalizedTitle, normalized));
  
  if (existing.length > 0) {
    // Merge stores and sort alphabetically
    const oldStores = JSON.parse(existing[0].stores) as string[];
    const newStores = Array.from(new Set([...oldStores, ...game.stores])).sort();
    
    await db
    .update(gameLibrary)
    .set({
        stores: JSON.stringify(newStores),
        duplicate: 1, // mark as duplicate
      })
      .where(eq(gameLibrary.id, existing[0].id));
    } else {
      const sortedStores = [...game.stores].sort();
      
      await db.insert(gameLibrary).values({
        ...game,
        normalizedTitle: normalized,
        stores: JSON.stringify(sortedStores),
        duplicate: 0,
      });
    }
  }
  
  
export async function gogGamesToDB(gogGames: any) {
    for (const game of gogGames) {
    const title = normalizeTitle(game.title);
    const store = 'GOG';
    
    const existing = await db.query.gameLibrary.findFirst({
      where: eq(gameLibrary.normalizedTitle, title),
    });

    if (existing) {
      const stores = JSON.parse(existing.stores);
      if (!stores.includes(store)) {
        stores.push(store);
        stores.sort();
      }

      await db.update(gameLibrary)
        .set({
          stores: JSON.stringify(stores),
          duplicate: 1,
        })
        .where(eq(gameLibrary.id, existing.id));
    } else {
      await db.insert(gameLibrary).values({
        title: game.title,
        normalizedTitle: title,
        stores: JSON.stringify(['GOG']),
        duplicate: 0,
      });
    }
  }
}
