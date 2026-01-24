
// Local libraries
import { upsertGame } from './helper';

type GameInsert = {
  title: string;
  genre?: string;
  stores: string[];
  pricePaid?: number;
};



// --- Fetch GOG library via session cookie ---
type GOGGame = {
  title: string;
  released?: string;
  price?: number;
};

export async function fetchGOGLibrary(cookie: string): Promise<GOGGame[]> {
  let url = 'https://embed.gog.com/user/data/games?include=description&productType=game';
  const res = await fetch(url,
    {
      headers: {
        Cookie: `gog-al=${cookie}; gog_lc=CA_CAD_en-US`,
        'User-Agent': 'Mozilla/5.0',
        'accept': 'application/json',
      },
    });

  console.log(">>>>", res.ok)
  console.log(">>>>>>", res.statusText)
  console.log("!!!!!!!!!!!!!")
  if (!res.ok) {
    throw new Error(`Failed to fetch GOG library: ${res.statusText}`);
  }

  const data = await res.json();
  return data.products.map((p: any) => ({
    title: p.title,
    released: p.released,
    price: p.price?.amount,
  }));
}

// --- Import GOG games into database ---
export async function importGOGGames(cookie: string) {
  const gogGames = await fetchGOGLibrary(cookie);

  for (const game of gogGames) {
    await upsertGame({
      title: game.title,
      stores: ['GOG'],
      pricePaid: game.price,
    });
  }

  console.log(`Imported ${gogGames.length} GOG games into the database!`);
}

// --- Example usage ---
// Replace with your GOG session cookie string
// const cookie = '';
// importGOGGames(cookie).catch(console.error);
