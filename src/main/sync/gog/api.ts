// export async function fetchGogLibrary(gogAl: string) {

//   console.log(gogAl)

//   const res = await fetch(
//     'https://embed.gog.com/account/getFilteredProducts?mediaType=1',
//     {
//       headers: {
//         Cookie: `gog-al=${gogAl}`,
//         'User-Agent': 'Mozilla/5.0',
//       },
//     }
//   );

//   if (!res.ok) {
//     throw new Error(`GOG request failed (${res.status})`);
//   }

//   const data = await res.json();
//   return data.ownedGames;
// }
/**
 * Validates if the current session is authenticated with GOG.
 * Returns the data if successful, or null if not logged in.
 */

const { BrowserWindow, net } = require('electron');

export function fetchGogLibrary() {
  return new Promise((resolve, reject) => {
    // This URL is specific to your request
    const request = net.request('https://embed.gog.com/account/getFilteredProducts?mediaType=1&totalPages=1');
    
    request.on('response', (response) => {
      // GOG usually redirects to auth.gog.com if not logged in, or returns 401/403
      if (response.statusCode === 200 && response.headers['content-type'].includes('application/json')) {
        let body = '';
        response.on('data', (chunk) => {
          body += chunk;
        });
        response.on('end', () => {
          try {
            const parsedData = JSON.parse(body);
            resolve(parsedData);
          } catch (e) {
            reject("Failed to parse JSON");
          }
        });
      } else {
        // If status is not 200 or content is not JSON (likely a login HTML page)
        resolve(null); 
      }
    });

    request.on('error', (error) => {
      reject(error);
    });

    request.end();
  });
}

/**
 * Opens a popup window for the user to log in to GOG.
 * Resolves when the user reaches the account page.
 */
export function performLogin() {
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

    // Go to GOG login
    authWindow.loadURL('https://auth.gog.com/auth?client_id=46899977096215655&redirect_uri=https%3A%2F%2Fwww.gog.com%2Faccount&response_type=code&layout=default');

    // Listen for navigation to the account page (indicates success)
    authWindow.webContents.on('did-navigate', (event, url) => {
      if (url.includes('gog.com/account')) {
        authWindow.close();
        resolve(true);
      }
    });

    authWindow.on('closed', () => {
      // If closed manually, we resolve false (login might not have happened)
      resolve(false); 
    });
  });
}