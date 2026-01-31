import { ipcMain } from 'electron';

// Local libraries
import { performGogLoginAndFetch, processGogDataForDatabase } from '../sync/gog';
import { addOrUpdateGame } from "../db/action";
import { fetchSteamLibrary, fetchSteamLibraryUnofficial, prepSteamGamesForDatabase } from '../sync/steam';

// Main call that initiates the login fetch to GoG,
// trimming excess data, and adding / updating the database.
export function syncGogLibraryAndDB() {
  ipcMain.handle('sync:gog', async (event) => {
    console.log('Starting GOG library sync...');
    // throw new Error("FAILED TO SYNC");   // Test the error message
    
    const rawData = await performGogLoginAndFetch();
    const preppedGames = processGogDataForDatabase(rawData);
    console.debug("Number of games post-processing: ", preppedGames.length);
    
    // Track the number added or updated to the database
    let addCount: number = 0, upsertCount: number = 0;
    for (const game of preppedGames) {
      if (game.isGame) {
        // Now the code actually waits here!
        const result = await addOrUpdateGame(game, 'GOG');
        
        if (result.success) {
            if (result.isNew) addCount++;
            if (result.isUpdated) upsertCount++;
        }

      }
    }
    
    console.info(`...GOG library sync completed. Added: ${addCount}, Updated: ${upsertCount}`);
    
    event.sender.send('sync-complete');
    return {newCount: addCount, updatedCount: upsertCount};
  });
}

// Main call that initiates the login fetch to Steam
export function syncSteamLibraryAndDB() {
  ipcMain.handle('sync:steam', async (event, apiKey: string, steamId: string) => {
    if (!apiKey) {
      throw new Error('API key missing');
    } else if (!steamId) {
      throw new Error('Steam ID missing');
    }
    
    console.log('Starting Steam library sync...');
    
    const rawData = await fetchSteamLibrary(apiKey, steamId);
    const preppedGames = prepSteamGamesForDatabase(rawData);
    console.debug("Number of prepped games: ", preppedGames.length);

    // Track the number added or updated to the database
    let addCount = 0, upsertCount = 0;
    for (const game of preppedGames) {
      console.debug("GAME>>>>>>>>>", game.isGame);
      if (game.isGame) {
          const result = await addOrUpdateGame(game, 'Steam');

          if (result.success) {
            if (result.isNew) addCount++;
            if (result.isUpdated) upsertCount++;
        }

      }
    }

    console.info(`...Steam library sync completed. Added: ${addCount}, Updated: ${upsertCount}`);

    event.sender.send('sync-complete');
    return {newCount: addCount, updatedCount: upsertCount};
    
  });
}

export function syncSteamLibraryAndDBUnofficial() {
  ipcMain.handle('sync:steamNoApi', async (_event, steamId: string) => {
    if (!steamId) {
      throw new Error('Steam ID missing');
    }

    console.log('Starting Steam library sync using unofficial API...');

    const rawData = await fetchSteamLibraryUnofficial(steamId);
    console.log(">>>>>>>>>>DATA RETURNED: ", rawData.length)
    
    console.info('...Steam library sync completed.');
  });
}
