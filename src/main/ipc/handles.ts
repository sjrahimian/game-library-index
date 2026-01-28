import { ipcMain } from 'electron';
import { performGogLoginAndFetch } from '../sync/gog';

export function syncGogLibraryAndDB() {
  ipcMain.handle('sync:gog', async () => {
    console.log('Starting GOG library sync...');
    // throw new Error("FAILED TO SYNC");   // Test the error message
  
    const rawData = await performGogLoginAndFetch();
    // Run with your rawData
    // checkDuplicates(rawData);
    // Insert into database

    
  });
}



export function syncSteamLibraryAndDB() {
  ipcMain.handle('import:gog', async () => {
    console.log('Starting Steam library sync...');
  });
}
