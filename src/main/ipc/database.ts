import { ipcMain } from 'electron';
import { and, count, eq, sql } from 'drizzle-orm';

// Local libraries
import { db } from '../db/client';
import { games, store_entries } from '../db/schema';
import { normalizeOSData } from '../db/action';

export function getGames() {
    ipcMain.handle('get-games', async () => {

    try {
        // 1. Fetch all games and their associated store entries using a join
        const rows = await db
        .select({
            id: games.id,
            title: games.title,
            normalizedTitle: games.normalizedTitle,
            slug: games.slug,
            category: games.category,
            releaseDate: games.releaseDate,
            storeName: store_entries.storeName,
            storeSpecificId: store_entries.storeSpecificId,
            osSupported: store_entries.osSupported,
        })
        .from(games)
        .leftJoin(store_entries, eq(games.id, store_entries.gameId))
        .all();

        // 2. Group the results by game ID
        // Since a JOIN returns one row per store entry, we group them back into a single game object
        const library = rows.reduce((acc, row) => {
        const gameId = row.id;

        if (!acc[gameId]) {
            acc[gameId] = {
            id: row.id,
            title: row.title,
            slug: row.slug,
            category: row.category,
            releaseDate: row.releaseDate,
            stores: [], // This will hold our list of store objects
            duplicate: false, 
            };
        }

        // Add the store information to the array if it exists
        if (row.storeName) {
            acc[gameId].stores.push({
            name: row.storeName,
            externalId: row.storeSpecificId,
            os: row.osSupported ? JSON.parse(row.osSupported) : null
            });
        }

        // 3. Mark as duplicate if the game is owned in more than one store
        acc[gameId].duplicate = acc[gameId].stores.length > 1;

        return acc;
        }, {} as Record<number, any>);

        // Convert the object back into an array for the frontend
        return Object.values(library);

    } catch (error) {
        console.error("Failed to fetch library:", error);
        return { success: false, error: error.message };
    }

    });
}

export function setupStatsHandlers() {
  ipcMain.handle('get-stats', async () => {
    try {
      // 1. Total GOG Games
      const gogRes = await db
        .select({ value: count() })
        .from(store_entries)
        .where(eq(store_entries.storeName, 'GOG'));

      // 2. Total Steam Games
      const steamRes = await db
        .select({ value: count() })
        .from(store_entries)
        .where(eq(store_entries.storeName, 'Steam'));

      // 3. Duplicate Games
      // We find games that have more than one entry in the store_entries table
      const duplicateQuery = db
        .select({ gameId: store_entries.gameId })
        .from(store_entries)
        .groupBy(store_entries.gameId)
        .having(sql`count(${store_entries.gameId}) > 1`)
        .as('duplicates');

      const dupeRes = await db
        .select({ value: count() })
        .from(duplicateQuery);

      return {
        gog: gogRes[0]?.value || 0,
        steam: steamRes[0]?.value || 0,
        total: (gogRes[0]?.value || 0) + (steamRes[0]?.value || 0),
        duplicates: dupeRes[0]?.value || 0
      };
    } catch (error) {
      console.error("Failed to fetch library stats:", error);
      return { gog: 0, steam: 0, duplicates: 0 };
    }
  });
}

/**
 * Generates a random delay to mimic human behavior
 * @param min Minimum milliseconds
 * @param max Maximum milliseconds
 * @param breakChance 0-1 chance of taking a longer 5-10 second break
 */
const humanDelay = async (min = 2000, max = 5000, breakChance = 0.05) => {
  const isTakingBreak = Math.random() < breakChance;
  
  const delay = isTakingBreak 
    ? Math.floor(Math.random() * (12000 - 7000) + 7000) // Long break: 7-12s
    : Math.floor(Math.random() * (max - min) + min);   // Normal jitter: 2-5s

  if (isTakingBreak) console.log("Taking a human-like break...");
  return new Promise(resolve => setTimeout(resolve, delay));
};

/**
 * Converts Steam's date strings to YYYY-MM-DD
 * Example: "Nov 14, 2011" -> "2011-11-14"
 */
function formatSteamDate(dateString: string): string | null {
  if (!dateString || dateString.toLowerCase().includes('soon')) {
    return null; 
  }

  const date = new Date(dateString);
  
  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return null;
  }

  // Returns YYYY-MM-DD
  return date.toISOString().split('T')[0];
}

export async function hydrateSteamGames(event: Electron.IpcMainInvokeEvent) {
  // Find Steam games that are missing data
  const gamesToHydrate = await db
    .select({
      id: games.id,
      appId: store_entries.storeSpecificId,
    })
    .from(games)
    .innerJoin(store_entries, eq(games.id, store_entries.gameId))
    .where(
      and(
        eq(store_entries.storeName, 'Steam'),
        eq(games.category, "Steam Hydrate")
      )).all();

  if (gamesToHydrate.length === 0) {
    console.info("No Steam games to hydrate.");
    return;
  }
  
  event.sender.send('hydration-started');
  console.info(`Starting background hydration for ${gamesToHydrate.length} games...`);
  
  for (const game of gamesToHydrate) {
    try {
      await humanDelay(2000, 4500, 0.08); 

      const response = await fetch(`https://store.steampowered.com/api/appdetails?appids=${game.appId}`);
      
      // If we hit a 429 (Too Many Requests), stop immediately and wait much longer
      if (response.status === 429) {
        console.warn("Rate limit hit! Cooling down for 1 minute...");
        await new Promise(res => setTimeout(res, 60000));
        const response = await fetch(`https://store.steampowered.com/api/appdetails?appids=${game.appId}`);
      }

      const data = await response.json();

      if (data[game.appId]?.success) {
        const details = data[game.appId].data;

        // Update the games table
        const genre = details.genres ? details.genres[0]?.description : 'Unknown';
        const newDate = formatSteamDate(details.release_date?.date || null);
        await db.update(games)
          .set({
            category: genre,
            releaseDate: newDate,
          }).where(eq(games.id, game.id));

        // Update the store_entries table
        await db.update(store_entries)
          .set({ osSupported: normalizeOSData(details.platforms), })
          .where(eq(store_entries.gameId, game.id));

          
        // IMPORTANT: Tell the frontend this specific game is ready
        event.sender.send('game-hydrated', { 
          gameId: game.id, 
          appId: game.appId,
          os: details.platforms,
          category: genre,
          releaseDate: newDate,
        });

        console.log(`Hydrated: ${details.name}`);
      }

    } catch (error) {
      console.error(`Failed to hydrate appId ${game.appId}:`, error);
    }
  }
}

