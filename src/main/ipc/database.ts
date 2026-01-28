import { ipcMain } from 'electron';
import { eq } from 'drizzle-orm';

// Local libraries
import { db } from '../db/client';
import { games, store_entries } from '../db/schema';

export function getGames() {
    ipcMain.handle('get-games', async () => {

    try {
        // 1. Fetch all games and their associated store entries using a join
        const rows = await db
        .select({
            id: games.id,
            title: games.title,
            normalizedTitle: games.normalizedTitle,
            slug: games.slug,
            category: games.category,
            releaseDate: games.releaseDate,
            storeName: store_entries.storeName,
            storeSpecificId: store_entries.storeSpecificId,
            osSupported: store_entries.osSupported,
        })
        .from(games)
        .leftJoin(store_entries, eq(games.id, store_entries.gameId))
        .all();

        // 2. Group the results by game ID
        // Since a JOIN returns one row per store entry, we group them back into a single game object
        const library = rows.reduce((acc, row) => {
        const gameId = row.id;

        if (!acc[gameId]) {
            acc[gameId] = {
            id: row.id,
            title: row.title,
            slug: row.slug,
            category: row.category,
            releaseDate: row.releaseDate,
            stores: [], // This will hold our list of store objects
            duplicate: false, 
            };
        }

        // Add the store information to the array if it exists
        if (row.storeName) {
            acc[gameId].stores.push({
            name: row.storeName,
            externalId: row.storeSpecificId,
            os: row.osSupported ? JSON.parse(row.osSupported) : null
            });
        }

        // 3. Mark as duplicate if the game is owned in more than one store
        acc[gameId].duplicate = acc[gameId].stores.length > 1;

        return acc;
        }, {} as Record<number, any>);

        // Convert the object back into an array for the frontend
        return Object.values(library);

    } catch (error) {
        console.error("Failed to fetch library:", error);
        return { success: false, error: error.message };
    }

    });
}