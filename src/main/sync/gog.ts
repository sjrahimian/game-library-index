import { net } from 'electron';
import { BrowserWindow } from 'electron';

export async function clearCookies() {
  const authWindow = new BrowserWindow({
    width: 600,
    height: 800,
    show: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  await authWindow.webContents.session.clearStorageData();
  authWindow.close()
}

export async function performGogLoginAndFetch() {
  const authWindow = new BrowserWindow({
    width: 600,
    height: 800,
    show: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  try {

    await handleLogin(authWindow);
    console.log("Login confirmed. Starting data fetch...");
    await new Promise(resolve => setTimeout(resolve, 2000));


    // Start of fetch data
    let page = 1;
    let maxPage = 1;
    let totalProducts = -1;
    let allProducts: any[] = [];

    while (page <= maxPage) {
      console.log(`Fetching page ${page}/${maxPage}...`);
      
      // Fetch the specific page and wait for the result
      const data = await fetchPageData(authWindow, page);
      
      // Update maxPage from the API response
      if (data.totalPages && maxPage < Number(data.totalPages)) {
        console.debug("Old max number of pages: ", maxPage);
        maxPage = Number(data.totalPages);
        console.debug("GOG account number of pages: ", data.totalPages);
        console.debug("Max number of pages: ", maxPage);
      }
      
      if (data.totalProducts && totalProducts < Number(data.totalProducts)) {
        totalProducts = Number(data.totalProducts);
      }

      // Aggregate products
      if (data.products && Array.isArray(data.products)) {
        allProducts = allProducts.concat(data.products);
      }

      page++;
    }

    console.log(`GOG account has ${totalProducts} games.`);
    console.log(`Finished! Collected ${allProducts.length} games.`);
    authWindow.close();
    return allProducts;

  } catch (error) {
    if (authWindow) { authWindow.close(); };
    console.error("Process failed:", error);
    new Error(`${error}`);
  }
}

// --- HELPER 1: Handle Login ---
function handleLogin(window: BrowserWindow): Promise<void> {
  return new Promise((resolve, reject) => {
    const loginUrl = 'https://auth.gog.com/auth?client_id=46899977096215655&redirect_uri=https%3A%2F%2Fembed.gog.com%2Fon_login_success%3Forigin%3Dclient&response_type=code&layout=default';
    window.loadURL(loginUrl);

    const onNavigate = (event: any, url: string) => {
      // Check if we hit the success URL
      if (url.includes('on_login_success') && url.startsWith('https://embed.gog.com/on_login_success')) {
        window.webContents.removeListener('did-navigate', onNavigate); // Cleanup listener
        resolve(); // Unblock the main function
      }
    };

    // Listen for navigation
    window.webContents.on('did-navigate', onNavigate);
    window.webContents.on('did-redirect-navigation', onNavigate); // Catch redirects too

    // Handle user closing window early
    window.on('closed', () => reject(new Error('User closed login window')));
  });
}

// --- HELPER 2: Fetch Single Page ---
function fetchPageDataScrape(window: BrowserWindow, page: number): Promise<any> {
  console.log("Getting ready to fetch...")
  return new Promise((resolve, reject) => {
    const apiUrl = `https://embed.gog.com/account/getFilteredProducts?mediaType=1&page=${page}`;
    console.log("Loading url for fetch...")
    window.loadURL(apiUrl);
    console.log("Post loading url for fetch...")
    
    // We wait for the load to finish, then scrape the JSON from the body
    window.webContents.once('did-finish-load', async () => {
      console.log("Pre-trying to fetch...")
      try {
        console.log("Trying to fetch...")
        const bodyText = await window.webContents.executeJavaScript('document.body.innerText');
        const json = JSON.parse(bodyText);
        resolve(json);
      } catch (err) {
        reject(err);
      }
    });

    // Timeout safety in case page hangs
    setTimeout(() => reject('Page load timed out'), 10000);
    console.log("END OF CODE");
  });
}

// Safer alternative that avoids executeJavaScript entirely
function fetchPageData(window: BrowserWindow, page: number): Promise<any> {
  return new Promise((resolve, reject) => {
    // We use the session from the window so cookies are included automatically
    const request = net.request({
      url: `https://embed.gog.com/account/getFilteredProducts?mediaType=1&page=${page}`,
      session: window.webContents.session, // Crucial: use the logged-in session
      useSessionCookies: true
    });

    request.on('response', (response) => {
      let body = '';
      response.on('data', (chunk) => body += chunk);
      response.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          console.error("GOG API returned HTML instead of JSON. First 100 chars:", body.substring(0, 100));
          reject(new Error("GOG returned HTML (likely a login or redirect page) instead of data."));
        }
      });
    });

    request.on('error', (error) => reject(error));
    request.end();
  });
}

// Checks the raw data for duplicate entries based on IDs and Slugs
export function checkDuplicates(games: any[]) {
  // Use a Set to store unique IDs we've already seen
  const seenIds = new Set();
  const seenSlugs = new Set();

  console.log("--- Starting Duplicate Check ---");

  for (const game of games) {
    const { id, title, slug } = game;
    let isDuplicate = false;

    // Already exists
    if (seenIds.has(id)) {
      console.warn(`[DUPLICATE ID] Found repeated ID ${id} for: "${title}"`);
      isDuplicate = true;
    } else {
      seenIds.add(id);
    }

    // Check if slug already exists (useful for cross-store checks)
    if (seenSlugs.has(slug)) {
      console.warn(`[DUPLICATE SLUG] Found repeated Slug "${slug}" for: "${title}"`);
      isDuplicate = true;
    } else {
      seenSlugs.add(slug);
    }
  }

  console.log(`--- Check Complete. Processed ${games.length} entries. ---`);
}

/**
 * Transforms raw GOG API data into a format ready for database insertion.
 * @param {Array} rawData - The array of objects from the GOG API.
 * @returns {Array} - An array of processed objects for the database.
 */
export function processGogDataForDatabase(rawData: any[]) {
  return rawData.map(item => {
    // Extract only the requested fields
    const { 
      id, 
      title, 
      worksOn, 
      category, 
      isGame, 
      slug, 
      releaseDate 
    } = item;

    const dateOnly = releaseDate?.date.split(' ')[0] || null;
    // Return a new object structured for your database tables
    return {
      id: String(id), 
      title: title,
      slug: slug,
      category: category,
      isGame: isGame,
      worksOn: worksOn,
      releaseDate: dateOnly
    };
  });
}

