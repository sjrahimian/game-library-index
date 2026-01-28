import { ipcMain } from 'electron';

// Local libraries
import { performGogLoginAndFetch, processGogDataForDatabase } from '../sync/gog';
import { addOrUpdateGame } from "../db/action";

export function syncGogLibraryAndDB() {
  ipcMain.handle('sync:gog', async () => {
    console.log('Starting GOG library sync...');
    // throw new Error("FAILED TO SYNC");   // Test the error message
  
    const rawData = await performGogLoginAndFetch();
    // Run with and iInsert into database
    const processedGames = processGogDataForDatabase(rawData);

    // You can now loop through this and call your database function
    processedGames.forEach(async (game) => {
      if (game.isGame) {
        await addOrUpdateGame(game, 'GOG');
      }
    });
    
  });
}



export function syncSteamLibraryAndDB() {
  ipcMain.handle('import:gog', async () => {
    console.log('Starting Steam library sync...');
  });
}
