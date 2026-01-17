import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure data directory exists
const dataDir = join(__dirname, '../../../data');
if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
}

const dbPath = join(dataDir, 'expenses.db');

// Create SQLite connection with WAL mode for better concurrency
const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');

// Create Drizzle instance
export const db = drizzle(sqlite, { schema });

// Export raw sqlite for migrations
export { sqlite };
