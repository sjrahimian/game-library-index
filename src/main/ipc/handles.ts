import { ipcMain } from 'electron';
import { performGogLoginAndFetch } from '../sync/gog';

export function syncGogLibraryAndDB() {
  ipcMain.handle('login:gog', async () => {
    console.log('Starting GOG library sync...');

    let curPage = 0, maxPage = 1, data = [];

    // Loop until we have fetched all pages
    while (curPage <= maxPage) {
      console.log(`Fetching page ${curPage}/${maxPage}...`);
      const newData = await performGogLoginAndFetch(String(curPage));
      curPage++;

      if (newData) {
        if (newData.totalPages > maxPage) {
          maxPage = Number(newData.totalPages);
        }

        // 2. Append the new products to our master list
        if (newData.products && Array.isArray(newData.products)) {
          data = data.concat(newData.products);
        }
      } else {
        console.error(`Failed to fetch page ${curPage}`);
        break; // Stop if a fetch fails to prevent infinite loops
      }
    }

    console.log(data)

    return { products: data };
  });
}

export function syncSteamLibraryAndDB() {
  ipcMain.handle('import:gog', async () => {
    console.log('Starting Steam library sync...');
  });
}
