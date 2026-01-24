import { BrowserWindow, session, net } from 'electron';

export async function openGogLogin(): Promise<void> {
  return new Promise((resolve, reject) => {
    const win = new BrowserWindow({
      width: 600,
      height: 800,
      webPreferences: { 
        nodeIntegration: false,
        contextIsolation: true
      },
    });
    
    win.loadURL('https://embed.gog.com/account/getFilteredProducts?mediaType=1&totalPages');
    
    win.webContents.on('did-navigate', async (event, url) => {
      // Only fetch after user hits the embed page
      if (url.startsWith('https://embed.gog.com/account')) {
        try {
          const cookies = await session.defaultSession.cookies.get({ domain: '.gog.com' });
          console.table(cookies.map(c => ({ name: c.name, domain: c.domain })));

          // Now fetch the library
          const library = await fetchGogLibraryNew();
          console.log('GOG library length:', library.length);

          win.close();
          resolve(library); // return the data
        } catch (err) {
          win.close();
          reject(err);
        }
      }
    });

    win.on('closed', () => {
      // fallback in case user closes window prematurely
      reject(new Error('Login window closed before completing authentication'));
    });
  });
}



export function fetchGogLibraryNew(): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const request = net.request({
      method: 'GET',
      url: 'https://embed.gog.com/account/getFilteredProducts?mediaType=1',
      session: session.defaultSession,
    });

    request.setHeader('Accept', 'application/json');
    // request.setHeader('User-Agent', 'Mozilla/5.0');
    // request.setHeader('Referer', 'https://embed.gog.com/');
    // request.setHeader('Origin', 'https://embed.gog.com');

    let body = '';

    request.on('response', (response) => {
      response.on('data', chunk => (body += chunk.toString()));

      response.on('end', () => {
        if (response.statusCode !== 200) {
          console.error('GOG RAW RESPONSE:', body);
          return reject(
            new Error(`GOG request failed (${response.statusCode})`)
          );
        }

        try {
          const json = JSON.parse(body);
          resolve(json.products ?? []);
        } catch (err) {
          reject(err);
        }
      });
    });

    request.on('error', reject);
    request.end();
  });
}
