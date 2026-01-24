import { ipcMain } from 'electron';
import { openGogLogin, openGogLoginAndFetchViaSession, fetchGogLibraryNew } from '../sync/gog/login';
import { fetchGogLibrary, performLogin } from '../sync/gog/api';
import { getGogAccessToken, waitForGogEmbedAuth } from '../sync/gog/cookies';
import { gogGamesToDB } from '../sync/helper';

// export function registerGOGImportIPC() {
// //   ipcMain.handle('gog:import', async (_event, cookie: string) => {
// //     console.log(cookie)

// //     if (!cookie || !cookie.includes('user_token')) {
// //       throw new Error('Invalid GOG session cookie');
// //     }

// //     await importGOGGames(cookie);
// //     return { success: true };
// //   });

//   // New method
//   ipcMain.handle('gog:import', async () => {
//     try {
//       await getGogAccessToken();
//     } catch {
//       openGogLogin();
//     }
    
//     const token = await getGogAccessToken();
//     console.log(token)
//     const games = await fetchGogLibrary(token);
//     console.log('=================> games fetched')
//     console.log(games)
//     console.log('=================> games dumped')

//     await gogGamesToDB(games);
    
//     return games.length;
//   });

// }

export function gogLoginIPC() {
//   ipcMain.handle('gog:login', async () => {
//     console.log("PRE LOGIN")
//     await openGogLogin();
//     // await openGogLoginAndFetchViaSession();
//     // await waitForGogEmbedAuth();
//     // const games = await fetchGogLibraryNew();
//     console.log("POST LOGIN")
//     // return `Imported ${games.length} games from GOG`;
//     // return true;
//   });

// IPC Handler: Your localhost app calls this
ipcMain.handle('gog:login', async () => {
  try {
    // 1. Try to fetch silently
    console.log('Attempting to fetch GOG data...');
    let data = await fetchGogLibrary();

    // 2. If no data (not logged in), trigger login flow
    if (!data) {
      console.log('User not logged in. Opening login window...');
      const loggedIn = await performLogin();
      
      if (loggedIn) {
        console.log('Login detected. Retrying fetch...');
        data = await fetchGogLibrary();
      } else {
        throw new Error("User closed login window or login failed.");
      }
    }

    return { success: true, data: data };

  } catch (error) {
    console.error(error);
    return { success: false, error: error.message };
  }
});
}