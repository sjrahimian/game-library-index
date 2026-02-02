
import { eq, and } from 'drizzle-orm';

// Local libraries
import { db } from './client';
import { games, store_entries } from './schema';

/**
 * Normalizes video game title to be a consistent format:
 * @param {String} title - The raw string to undergo:
 *  - lowercase conversion
 *  - trimmed spaces
 *  - removed accents, punctuations
 *  - replaced spaces with dash
 * @returns {String} - The clean string
 */
export function normalizeTitle(title: string): string {
  if (!title) return "";
  return title
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
}

/**
 * Normalize video game OS support data to a consistent format:
 * @param {Record} rawOS - The raw object received from the API
 * @returns {string} - A stringified JSON object in the format of
 *   { windows: boolean, mac: boolean, linux: boolean }
 */
export function normalizeOSData(rawOS: Record<string, any> = {}): string {
  // We use a case-insensitive check by lowercasing all keys first
  const normalizedKeys = Object.keys(rawOS).reduce((acc, key) => {
    acc[key.toLowerCase()] = rawOS[key];
    return acc;
  }, {} as Record<string, any>);

  const cleanOS = {
    windows: !!(normalizedKeys.windows || normalizedKeys.Windows),
    mac: !!(normalizedKeys.mac || normalizedKeys.Mac),
    linux: !!(normalizedKeys.linux || normalizedKeys.Linux),
  };

  return JSON.stringify(cleanOS);

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
        osSupported: normalizeOSData(gameData.worksOn),
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
    
    // Check if this specific game already exists
    const normalized = normalizeTitle(gameData.title);
    let status = false;

    // Check if this specific game entry already exists for this game
    let gameRecord = await db.select()
      .from(games)
      .where(eq(games.normalizedTitle, normalized))
      .get();

    // Check if this specific store entry already exists for this game
    let existingEntry = await db.select()
      .from(store_entries)
      .where(
        and(
          eq(store_entries.gameId, gameRecord.id),
          eq(store_entries.storeName, storeName)
        )
      )
      .get();
      
    if (!gameRecord && !existingEntry){
      console.error(`Game "${gameData.title}" not in database! Should add instead of updating.`);
      return addGameToDatabase(gameData, storeName);
      // throw new Error("Game not in database! Should add instead of updating.");
    }

    // Update existing game table
    if (gameRecord){
      await db.update(games)
      .set({
        title: gameData.title,
        normalizedTitle: normalized,
        slug: gameData.slug,
        category: gameData.category,
        releaseDate: gameData.releaseDate?.date || gameData.releaseDate,
      })
      .where(eq(games.id, gameRecord.id));
      status = true;
    }
    
    // Update existing store entry table
    if (existingEntry) {
      await db.update(store_entries)
      .set({
        storeSpecificId: String(gameData.id),
        osSupported: JSON.stringify(gameData.worksOn),
      })
      .where(eq(store_entries.id, existingEntry.id));
      status = true;
    }

    console.debug(`Updated tables for: ${gameData.title}`);
    return { success: true, gameId: gameRecord.id, isUpdated: status };

  } catch (error) {
    console.error("Database sync error:", error);
    return { success: false, error };
  }
}