import { ipcMain } from 'electron';

// Local libraries
import { clearCookies, performGogLoginAndFetch, processGogDataForDatabase } from '../sync/gog';
import { addGameToDatabase } from "../db/action";
import { fetchSteamLibrary, fetchSteamLibraryUnofficial, prepSteamGamesForDatabase } from '../sync/steam';
import { hydrateSteamGames } from './database';

// Main call that initiates game list login fetch to GoG
export function clearGogCookies() {
  ipcMain.handle('clear:gog', async (event) => {
    await clearCookies();
  });
}
export function syncGogLibraryAndDB() {
  ipcMain.handle('sync:gog', async (event) => {
    console.log('Starting GOG library sync...');
    // throw new Error("FAILED TO SYNC");   // Test the error message
    
    const rawData = await performGogLoginAndFetch();
    const preppedGames = processGogDataForDatabase(rawData);
    console.debug("Number of games post-processing: ", preppedGames.length);
    
    let addCount: number = 0;
    for (const game of preppedGames) {
      if (game.isGame) {
        const result = await addGameToDatabase(game, 'GOG');
        
        if (result.success) {
            if (result.isNew) addCount++;
        }

      }
    }
    
    event.sender.send('sync-complete');
    console.info(`...GOG library sync completed. Added: ${addCount}`);
    
    return {count: addCount};
  });
}

// Main call that initiates game list fetch to Steam
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

    let addCount = 0;
    for (const game of preppedGames) {
      if (game.isGame) {
        const result = await addGameToDatabase(game, 'Steam');

        if (result.success) {
          if (result.isNew) addCount++;
        }

      }
    }

    // Start hydration in background
    hydrateSteamGames(event).then(() => {
      console.info("Hydration completed.")
      event.sender.send('hydration-finished');
    });

    event.sender.send('sync-complete');
    console.info(`...Steam library sync completed. Added: ${addCount}`);

    return {count: addCount};
    
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
