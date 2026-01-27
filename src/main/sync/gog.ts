import { BrowserWindow } from 'electron';

export function performGogLoginAndFetch(page: string) {
  return new Promise((resolve, reject) => {
    const authWindow = new BrowserWindow({
      width: 600,
      height: 800,
      show: true, // Set to true so you can see the login process
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    const loginUrl =
    'https://auth.gog.com/auth?client_id=46899977096215655&redirect_uri=https%3A%2F%2Fembed.gog.com%2Fon_login_success%3Forigin%3Dclient&response_type=code&layout=default';
    const apiUrl =
    'https://embed.gog.com/account/getFilteredProducts?mediaType=1&totalPages&pages=${page}';
    
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
            'document.querySelector("body").innerText',
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

export function parseGogData() {}