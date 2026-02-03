import { app } from 'electron';
import path from 'path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

// SQLite DB location
const getDatabasePath = (filename: string) => {
  // Keeps database local in the project root
  if (process.env.NODE_ENV === 'development') {
    return path.join(__dirname, `../../../${filename}`);
  }

  // Check if the app is installed in Program Files
  const exePath = app.getPath('exe');
  const isProgramFiles = exePath.includes('Program Files');

  if (isProgramFiles) {
    // If it's via an installer, use the safe AppData folder
    return path.join(app.getPath('userData'), filename);
  } else {
    // If it portable 
    return path.join(path.dirname(exePath), filename);
  }
};

const dbPath = getDatabasePath('gamelib.db');
console.debug("Database path: ", dbPath);

// Initialization
const connection = new Database(dbPath);
export const db = drizzle(connection);

// Optional: ensure table exists
connection.exec(`
  CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    normalized_title TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    slug TEXT,
    category TEXT,
    release_date TEXT
  );

  CREATE TABLE IF NOT EXISTS store_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER,
    store_name TEXT NOT NULL,
    store_specific_id TEXT NOT NULL,
    os_supported TEXT,
    FOREIGN KEY (game_id) REFERENCES games(id)
  );
`);