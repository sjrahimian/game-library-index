import { app } from 'electron';
import path from 'path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

// SQLite DB location
const dbPath = path.join(app.getPath('userData'), 'gamelib.db');
// console.log(app.getPath('userData'))

// Keep database local in the project root
// const dbPath = path.join(__dirname, '../../gamelib.db'); 

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