import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import path from 'path';

// SQLite DB location
// const dbPath = path.join(app.getPath('userData'), 'library.db');

// Keep database local in the project root
const dbPath = path.join(__dirname, '../../gamelib.db'); 

const connection = new Database(dbPath);
export const db = drizzle(connection);

// Optional: ensure table exists
connection.exec(`
CREATE TABLE IF NOT EXISTS game_library (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  normalized_title TEXT NOT NULL,
  genre TEXT,
  stores TEXT,
  game_store_id REAL,
  duplicate INTEGER
);
`);
