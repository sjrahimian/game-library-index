/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

// Local libraries
import { db } from './db/client';
import { gameLibrary } from './db/schema';
import { seedGames } from './db/seed';
import { registerGOGImportIPC, gogLoginIPC } from './ipc/import';
import { isNull } from 'drizzle-orm';


class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug').default();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});




app.whenReady().then(async () => {
    // await seedGames();
    // registerGOGImportIPC();

    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);

// ************************************ \\
// IPC handlers account sync to game store
// gogLoginIPC();

// ************************ \\
// IPC handlers using Drizzle
// IPC handler to get all games
ipcMain.handle('get-games', async () => {
  const rows = await db.select().from(gameLibrary).all();

  return rows.map(r => ({
    ...r,
    stores: JSON.parse(r.stores),      // JSON stored in SQLite
    duplicate: Boolean(r.duplicate),   // convert 0/1 to boolean
  }));
});

// ipcMain.handle(
//   'addGame',
//   (_, game: { title: string; genre?: string; price?: number }) => {
//     db.insert(games).values(game);
//     return { success: true };
//   }
// );

// ipcMain.handle('deleteGame', (_, id: number) => {
//   db.delete(games).where(games.id.equals(id));
//   return { success: true };
// });



const { net, session } = require('electron');

// --- THE CORE LOGIC ---

/**
 * Validates if the current session is authenticated with GOG.
 * Returns the data if successful, or null if not logged in.
 */
function fetchGogLibrary() {
  return new Promise((resolve, reject) => {
    const request = net.request({
      method: 'GET',
      url: 'https://api.gog.com/v1/games',
      //useSessionCookies: true, // Explicitly use cookies
    });
    
    // REQUIRED: Spoof a real browser to avoid bot detection
    // request.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0');
    // request.setHeader('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8');
    // request.setHeader('Connection', 'keep-alive');

    request.on('response', (response) => {
      console.log(`GOG Response Status: ${response.statusCode}`); // Debugging help
      console.log(">>>", response)
      
      if (response.statusCode === 200) {
        let body = '';
        response.on('data', (chunk) => body += chunk);
        console.log(body)
        response.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            resolve(parsed);
          } catch (e) {
            console.error("Failed to parse JSON:", e);
            resolve(null);
          }
        });
      } else {
        // If 401/403, it means we aren't logged in or are blocked
        console.log('Fetch failed, user likely needs login.');
        resolve(null); 
      }
    });

    request.on('error', (error) => {
      console.error("Network error:", error);
      reject(error);
    });

    request.end();
  });
}

/**
 * Opens a popup window for the user to log in to GOG.
 * Resolves when the user reaches the account page.
 */
/**
 * Opens a popup window for the user to log in to GOG.
 * Resolves when the user reaches the success page.
 */
function performLogin() {
  return new Promise((resolve, reject) => {
    const authWindow = new BrowserWindow({
      width: 500,
      height: 600,
      parent: mainWindow,
      modal: true,
      webPreferences: {
        nodeIntegration: false
      }
    });

    // CORRECTED URL:
    // Client ID: 46899977096215655 (GOG Galaxy)
    // Redirect URI: https://embed.gog.com/on_login_success?origin=client
    const loginUrl = 'https://auth.gog.com/auth?client_id=46899977096215655&redirect_uri=https%3A%2F%2Fembed.gog.com%2Fon_login_success%3Forigin%3Dclient&response_type=code&layout=default';

    authWindow.loadURL(loginUrl);

    // Listen for navigation to the specific success page
    authWindow.webContents.on('did-navigate', (event, url) => {
      // The server redirects here upon successful login
      if (url.includes('on_login_success')) {
        authWindow.close();
        resolve(true);
      }
    });
    
    // Also listen for redirects (sometimes GOG uses 302 redirects which trigger did-redirect-navigation)
    authWindow.webContents.on('did-redirect-navigation', (event, url) => {
      if (url.includes('on_login_success')) {
        authWindow.close();
        resolve(true);
      }
    });

    authWindow.on('closed', () => {
      // If closed without resolving true, we assume failure
      resolve(false); 
    });
  });
}


function performLoginAndFetch() {
  return new Promise((resolve, reject) => {
    const authWindow = new BrowserWindow({
      width: 600,
      height: 800,
      show: true, // Set to true so you can see the login process
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    const loginUrl = 'https://auth.gog.com/auth?client_id=46899977096215655&redirect_uri=https%3A%2F%2Fembed.gog.com%2Fon_login_success%3Forigin%3Dclient&response_type=code&layout=default';
    // const apiUrl = 'https://api.gog.com/v1/games';
    const apiUrl = 'https://embed.gog.com/account/getFilteredProducts?mediaType=1&totalPages&pages=1';

    authWindow.loadURL(loginUrl);

    authWindow.webContents.on('did-navigate', async (event, url) => {
      // 1. Detect successful login redirect
      if (url.includes('on_login_success')) {
        console.log('Login successful, redirecting to API...');
        
        // 2. Redirect the window to the API URL
        // GOG will now use the session cookies it just set
        authWindow.loadURL(apiUrl);
      }

      // 3. Detect when we have reached the API page
      if (url === apiUrl) {
        try {
          // Use executeJavaScript to get the text content of the page
          const bodyText = await authWindow.webContents.executeJavaScript(
            'document.querySelector("body").innerText'
          );

          const jsonData = JSON.parse(bodyText);
          console.log('Successfully captured GOG Data:', jsonData);
          
          authWindow.close();
          resolve(jsonData);
        } catch (err) {
          console.error('Failed to parse API data from window:', err);
          reject(err);
        }
      }
    });

    authWindow.on('closed', () => {
      resolve(null);
    });
  });
}

// In your ipcMain.handle
ipcMain.handle('gog:login', async () => {
  const data = await performLoginAndFetch();
  if (data) {
    return { success: true, data };
  }
  return { success: false, error: 'Login or fetch failed' };
});

// IPC Handler: Your localhost app calls this
// ipcMain.handle('gog:login', async () => {
//   try {
//     // 1. Try to fetch silently
//     console.log('Attempting to fetch GOG data...');
//     let data = await fetchGogLibrary();

//     // 2. If no data (not logged in), trigger login flow
//     if (!data) {
//       console.log('User not logged in. Opening login window...');
//       const loggedIn = await performLogin();
      
//       if (loggedIn) {
//         console.log('Login detected. Retrying fetch...');
//         data = await fetchGogLibrary();
//         console.log(data)
//       } else {
//         throw new Error("User closed login window or login failed.");
//       }
//     }
//     if (data) {
//       return { success: true, data: data };
//     } else {
//       return { success: false, error: "Failed to fetch data after login" };
//     }


//   } catch (error) {
//     console.error(error);
//     return { success: false, error: error.message };
//   }
// });