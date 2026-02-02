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

/**
 * Fetches the user's game list using the unofficial community endpoint.
 * Requires the user's profile to be PUBLIC.
 */
export async function fetchSteamLibraryUnofficial(steamId: string) {
  return new Promise((resolve, reject) => {
    // This endpoint returns a JSON-rich format of the user's library
    const url = `https://steamcommunity.com/profiles/${steamId}/games/?tab=all&sort=name`;
    console.log(url);

    const request = net.request(url);

    request.on('response', (response) => {
      let data = '';
      response.on('data', (chunk) => { data += chunk; });
      response.on('end', () => {
        try {
          // The data is often embedded in a JavaScript variable 'rgGames' 
          // We need to extract the JSON string from the HTML body
          const match = data.match(/var rgGames = (\[.*\]);/);
          console.log(data)
          console.log(data.length)
          console.log(match)
          if (match && match[1]) {
            const games = JSON.parse(match[1]);
            resolve(games || []);
          } else {
            reject(new Error("Could not find game data. Is the profile private?"));
          }
        } catch (e) {
          reject(e);
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
