import { net } from 'electron';

export async function fetchSteamLibrary(apiKey: string, steamId: string) {
  return new Promise((resolve, reject) => {
    // The 'include_appinfo' flag gives us the game names and icons
    const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${steamId}&format=json&include_appinfo=true`;
    console.log("Starting data fetch...");
    
    const request = net.request(url);
    request.on('response', (response) => {
      let body = '';
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => {
        try {
          const json = JSON.parse(body);
          // Steam returns games in response.games
          console.info(`Finished! Collected ${json.response.games.length} games from Steam.`);
          resolve(json.response.games || []);
        } catch (e) {
          reject(new Error("Failed to parse Steam response"));
        }
      });
    });

    request.on('error', (err) => reject(err));
    request.end();
  });
}

export function prepSteamGamesForDatabase(rawData: any[]) {
  return rawData.map(item => {
    // Extract only the requested fields
    const { 
      appid, 
      name, 
    } = item;

    // Return a new object structured for your database tables
    return {
      id: String(appid), 
      title: name,
      slug: name.toLowerCase().replace(/ /g, '_'),
      category: "Steam Hydrate",  // Steam basic list doesn't provide
      isGame: true,
      worksOn: { windows: false, mac: false, linux: false }, // Steam basic list doesn't provide
      releaseDate: "Steam Hydrate" // Steam basic list doesn't provide
    };
  });
}
