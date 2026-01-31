
import { eq, and } from 'drizzle-orm';

// Local libraries
import { db } from './client';
import { games, store_entries } from './schema';


export function normalizeTitle(title: string) {
  if (!title) return "";
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
}

export async function addGameToDatabase(gameData: any, storeName: string) {
  const normalized = normalizeTitle(gameData.title);
  let statusNew = false;
  
  try {
    // 1. Check if the game already exists in the main 'games' table
    let gameRecord = await db.select()
      .from(games)
      .where(eq(games.normalizedTitle, normalized))
      .get();
    
    // 2. If it doesn't exist, create the main game entry
    if (!gameRecord) {
      const inserted = await db.insert(games).values({
        title: gameData.title,
        normalizedTitle: normalized,
        slug: gameData.slug,
        category: gameData.category,
        releaseDate: gameData.releaseDate?.date || gameData.releaseDate,
      }).returning();
      
      gameRecord = inserted[0];
      statusNew = true;
      // console.debug(`Created new game entry for: ${gameData.title}`);
    }
    
    // 3. Handle the store-specific entry
    // Check if this specific store entry already exists for this game
    const existingEntry = await db.select()
    .from(store_entries)
    .where(
      and(
        eq(store_entries.gameId, gameRecord.id),
        eq(store_entries.storeName, storeName)
      )
    )
    .get();
    
    if (!existingEntry) {
      // Create a brand new store entry
      await db.insert(store_entries).values({
        gameId: gameRecord.id,
        storeName: storeName,
        storeSpecificId: String(gameData.id),
        osSupported: JSON.stringify(gameData.worksOn),
      });
      console.log(`Added new ${storeName} entry for: ${gameData.title}`);
    }
    
    return { success: true, gameId: gameRecord.id, isNew: statusNew };
  } catch (error) {
    console.error("Database sync error:", error);
    return { success: false, error };
  }
}



export async function updateGame(gameData: any, storeName: string) {
  try {
    const normalized = normalizeTitle(gameData.title);
    let gameRecord = await db.select()
      .from(games)
      .where(eq(games.normalizedTitle, normalized))
      .get();

    if (!gameRecord){
      // console.error("Game not in database error:", gameData, gameRecord);
    }

        // 3. Handle the store-specific entry
      // Check if this specific store entry already exists for this game
      const existingEntry = await db.select()
        .from(store_entries)
        .where(
          and(
            eq(store_entries.gameId, gameRecord.id),
            eq(store_entries.storeName, storeName)
          )
        )
        .get();

      if (!existingEntry) {
        // Update existing store entry (e.g., if store ID changed or OS support updated)
        await db.update(store_entries)
          .set({
            storeSpecificId: String(gameData.id),
            osSupported: JSON.stringify(gameData.worksOn),
          })
          .where(eq(store_entries.id, existingEntry.id));
        // console.log(`Updated ${storeName} entry for: ${gameData.title}`);
      }
  } catch (error) {
    console.error("Database sync error:", error);
    return { success: false, error };
  }
}